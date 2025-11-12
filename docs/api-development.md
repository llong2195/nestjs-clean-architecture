# API Development Guide

This guide covers best practices for developing APIs in the NestJS Clean Architecture Boilerplate.

## Table of Contents

- [API Standards](#api-standards)
- [Creating New Endpoints](#creating-new-endpoints)
- [Request Validation](#request-validation)
- [Response Formatting](#response-formatting)
- [Error Handling](#error-handling)
- [Authentication & Authorization](#authentication--authorization)
- [API Documentation](#api-documentation)
- [Versioning](#versioning)
- [Testing APIs](#testing-apis)
- [Performance Optimization](#performance-optimization)

## API Standards

### RESTful Principles

Follow REST conventions for resource naming and HTTP methods:

| Method | Endpoint     | Description     | Status Code |
| ------ | ------------ | --------------- | ----------- |
| GET    | `/users`     | Get all users   | 200         |
| GET    | `/users/:id` | Get user by ID  | 200         |
| POST   | `/users`     | Create new user | 201         |
| PATCH  | `/users/:id` | Update user     | 200         |
| DELETE | `/users/:id` | Delete user     | 204         |

### URL Structure

```
https://api.example.com/api/v1/{resource}/{id}/{sub-resource}
                        └─┬─┘ └┬┘ └──┬───┘ └┬┘ └─────┬──────┘
                          │    │     │      │        │
                       Prefix Version Resource ID   Sub-resource
```

**Examples**:

- `GET /api/v1/users` - List all users
- `GET /api/v1/users/123` - Get user 123
- `GET /api/v1/users/123/posts` - Get posts by user 123
- `POST /api/v1/posts/456/comments` - Add comment to post 456

### Naming Conventions

**Resources**:

- Use plural nouns: `/users`, `/posts`, `/comments`
- Use kebab-case for multi-word resources: `/user-profiles`, `/blog-posts`

**Query Parameters**:

- Use camelCase: `?sortBy=createdAt&orderBy=desc`
- Pagination: `?page=1&limit=20`
- Filtering: `?status=active&role=admin`
- Search: `?q=search+term`

**Response Fields**:

- Use camelCase: `{ "userId": "123", "userName": "John" }`

## Creating New Endpoints

### Step-by-Step Guide

#### 1. Create Domain Entity

```typescript
// src/modules/product/domain/entities/product.entity.ts
export class Product {
  private constructor(
    public readonly id: string,
    private _name: string,
    private _price: Money,
    private _stock: number,
  ) {}

  static create(name: string, price: number, stock: number): Product {
    return new Product(uuid(), name, Money.create(price, 'USD'), stock);
  }

  updateStock(quantity: number): void {
    if (this._stock + quantity < 0) {
      throw new InsufficientStockException(this.id);
    }
    this._stock += quantity;
    this.addDomainEvent(new ProductStockUpdatedEvent(this.id, this._stock));
  }

  get name(): string {
    return this._name;
  }

  get price(): Money {
    return this._price;
  }

  get stock(): number {
    return this._stock;
  }
}
```

#### 2. Create Repository Interface

```typescript
// src/modules/product/domain/repositories/product.repository.interface.ts
export interface IProductRepository {
  save(product: Product): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findAll(page: number, limit: number): Promise<Product[]>;
  delete(id: string): Promise<void>;
}
```

#### 3. Create DTOs

```typescript
// src/modules/product/application/dtos/create-product.dto.ts
export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'MacBook Pro 16"',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Product price in USD',
    example: 2499.99,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({
    description: 'Stock quantity',
    example: 50,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  stock: number;
}

// src/modules/product/application/dtos/product-response.dto.ts
export class ProductResponseDto {
  @ApiProperty({ example: 'uuid-123' })
  id: string;

  @ApiProperty({ example: 'MacBook Pro 16"' })
  name: string;

  @ApiProperty({ example: 2499.99 })
  price: number;

  @ApiProperty({ example: 'USD' })
  currency: string;

  @ApiProperty({ example: 50 })
  stock: number;

  @ApiProperty({ example: '2025-01-11T12:00:00Z' })
  createdAt: Date;
}
```

#### 4. Create Use Case

```typescript
// src/modules/product/application/use-cases/create-product.use-case.ts
@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(dto: CreateProductDto): Promise<ProductResponseDto> {
    // 1. Create domain entity
    const product = Product.create(dto.name, dto.price, dto.stock);

    // 2. Persist
    const savedProduct = await this.productRepository.save(product);

    // 3. Return DTO
    return ProductMapper.toResponseDto(savedProduct);
  }
}
```

#### 5. Create Controller

```typescript
// src/modules/product/interface/http/product.controller.ts
@ApiTags('Products')
@Controller('products')
export class ProductController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductUseCase: GetProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.createProductUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiResponse({ status: 200, type: [ProductResponseDto] })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<ProductResponseDto[]> {
    return this.getProductsUseCase.execute(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, type: ProductResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.getProductUseCase.execute(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update product' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, type: ProductResponseDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.updateProductUseCase.execute(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete product' })
  @ApiBearerAuth()
  @ApiResponse({ status: 204, description: 'Product deleted' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.deleteProductUseCase.execute(id);
  }
}
```

#### 6. Register in Module

```typescript
// src/modules/product/product.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([ProductOrmEntity])],
  providers: [
    // Use cases
    CreateProductUseCase,
    GetProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,

    // Repository
    {
      provide: 'IProductRepository',
      useClass: ProductRepository,
    },

    // Mappers
    ProductMapper,
    ProductOrmMapper,
  ],
  controllers: [ProductController],
  exports: ['IProductRepository'],
})
export class ProductModule {}
```

## Request Validation

### Built-in Validators

```typescript
import {
  IsString,
  IsEmail,
  IsInt,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsDate,
  IsUUID,
  IsArray,
  IsOptional,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
  ValidateNested,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain uppercase, lowercase, number, and special character',
  })
  password: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  userName: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
```

### Custom Validators

```typescript
// src/common/validators/is-strong-password.validator.ts
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string): boolean {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);
    const hasMinLength = password.length >= 8;

    return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar && hasMinLength;
  }

  defaultMessage(): string {
    return 'Password must contain uppercase, lowercase, number, special character, and be at least 8 characters';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}

// Usage:
export class CreateUserDto {
  @IsStrongPassword()
  password: string;
}
```

### Nested Validation

```typescript
export class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  @Matches(/^\d{5}(-\d{4})?$/)
  zipCode: string;
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
```

### Array Validation

```typescript
export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class OrderItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
```

## Response Formatting

### Standard Response Format

All API responses follow this structure:

```typescript
// src/common/types/response.types.ts
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

### Success Response

```json
{
  "status": "success",
  "data": {
    "id": "uuid-123",
    "email": "user@example.com",
    "userName": "John Doe"
  },
  "meta": {
    "timestamp": "2025-01-11T12:00:00Z",
    "requestId": "req-uuid-456"
  }
}
```

### Paginated Response

```json
{
  "status": "success",
  "data": [
    { "id": "1", "name": "Product 1" },
    { "id": "2", "name": "Product 2" }
  ],
  "meta": {
    "timestamp": "2025-01-11T12:00:00Z",
    "requestId": "req-uuid-456",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Transform Interceptor

```typescript
// src/common/interceptors/transform.interceptor.ts
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.id || uuid();

    return next.handle().pipe(
      map((data) => ({
        status: 'success',
        data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId,
        },
      })),
    );
  }
}
```

## Error Handling

### Custom Exceptions

```typescript
// src/common/exceptions/custom-exceptions.ts
export class EmailAlreadyExistsException extends BadRequestException {
  constructor(email: string) {
    super({
      code: 'EMAIL_ALREADY_EXISTS',
      message: `User with email ${email} already exists`,
    });
  }
}

export class UserNotFoundException extends NotFoundException {
  constructor(id: string) {
    super({
      code: 'USER_NOT_FOUND',
      message: `User with ID ${id} not found`,
    });
  }
}

export class InsufficientStockException extends BadRequestException {
  constructor(productId: string) {
    super({
      code: 'INSUFFICIENT_STOCK',
      message: `Product ${productId} has insufficient stock`,
    });
  }
}
```

### Error Response Format

```json
{
  "status": "error",
  "error": {
    "code": "EMAIL_ALREADY_EXISTS",
    "message": "User with email user@example.com already exists"
  },
  "meta": {
    "timestamp": "2025-01-11T12:00:00Z",
    "requestId": "req-uuid-456"
  }
}
```

### Validation Error Response

```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "constraint": "isEmail",
        "message": "Invalid email format"
      },
      {
        "field": "password",
        "constraint": "minLength",
        "message": "Password must be at least 8 characters"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-01-11T12:00:00Z",
    "requestId": "req-uuid-456"
  }
}
```

### Global Exception Filter

Already configured in `src/common/filters/http-exception.filter.ts`:

```typescript
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = {
      status: 'error',
      error: {
        code: this.getErrorCode(exception),
        message: exception.message,
        ...(exception instanceof HttpException && exception.getResponse()),
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: request.id,
      },
    };

    response.status(status).json(errorResponse);
  }
}
```

## Authentication & Authorization

### Protected Routes

```typescript
@Controller('products')
export class ProductController {
  // Public route
  @Get()
  @Public()
  async findAll(): Promise<ProductResponseDto[]> {
    return this.getProductsUseCase.execute();
  }

  // Authenticated route
  @Get('my-purchases')
  @UseGuards(JwtAuthGuard)
  async getMyPurchases(@CurrentUser() user: User): Promise<ProductResponseDto[]> {
    return this.getMyPurchasesUseCase.execute(user.id);
  }

  // Role-based route
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.createProductUseCase.execute(dto);
  }
}
```

### Get Current User

```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: User): Promise<UserResponseDto> {
  return UserMapper.toResponseDto(user);
}
```

### Custom Guards

```typescript
// src/common/guards/owner.guard.ts
@Injectable()
export class OwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceOwnerId = request.params.id;

    return user.id === resourceOwnerId || user.role === UserRole.ADMIN;
  }
}

// Usage:
@Patch(':id')
@UseGuards(JwtAuthGuard, OwnerGuard)
async updateProfile(@Param('id') id: string, @Body() dto: UpdateUserDto) {
  // Only owner or admin can update
}
```

## API Documentation

### Swagger Decorators

```typescript
@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductController {
  @Post()
  @ApiOperation({
    summary: 'Create new product',
    description: 'Creates a new product in the inventory',
  })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    schema: {
      example: {
        status: 'error',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token missing or invalid',
  })
  async create(@Body() dto: CreateProductDto): Promise<ProductResponseDto> {
    return this.createProductUseCase.execute(dto);
  }
}
```

### DTO Documentation

```typescript
export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'MacBook Pro 16"',
    minLength: 3,
    maxLength: 100,
    required: true,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example: 'Latest MacBook Pro with M3 chip',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
```

### Access Documentation

```bash
# Start application
pnpm start:dev

# Open browser
open http://localhost:3000/api/docs
```

## Versioning

### URI Versioning (Current)

```typescript
// main.ts
app.setGlobalPrefix('api/v1');

// URLs:
// /api/v1/users
// /api/v1/products
```

### Header Versioning (Alternative)

```typescript
// main.ts
app.enableVersioning({
  type: VersioningType.HEADER,
  header: 'X-API-Version',
});

// Controller
@Controller('users')
export class UserController {
  @Get()
  @Version('1')
  findAllV1(): UserResponseDto[] {}

  @Get()
  @Version('2')
  findAllV2(): UserResponseDtoV2[] {}
}

// Request:
// GET /users
// X-API-Version: 1
```

## Testing APIs

### Unit Tests (Use Cases)

```typescript
describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let mockRepository: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
    } as any;

    useCase = new CreateProductUseCase(mockRepository);
  });

  it('should create product successfully', async () => {
    const dto: CreateProductDto = {
      name: 'MacBook Pro',
      price: 2499,
      stock: 50,
    };

    const savedProduct = Product.create(dto.name, dto.price, dto.stock);
    mockRepository.save.mockResolvedValue(savedProduct);

    const result = await useCase.execute(dto);

    expect(result.name).toBe(dto.name);
    expect(mockRepository.save).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Tests

```typescript
describe('ProductController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@example.com', password: 'Password123!' });

    authToken = response.body.data.accessToken;
  });

  it('POST /products - should create product', () => {
    return request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'MacBook Pro',
        price: 2499,
        stock: 50,
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.status).toBe('success');
        expect(res.body.data.name).toBe('MacBook Pro');
      });
  });

  it('GET /products/:id - should get product', async () => {
    // Create product first
    const createRes = await request(app.getHttpServer())
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'iPhone 15', price: 999, stock: 100 });

    const productId = createRes.body.data.id;

    // Get product
    return request(app.getHttpServer())
      .get(`/api/v1/products/${productId}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.data.id).toBe(productId);
      });
  });
});
```

## Performance Optimization

### Caching

```typescript
@Injectable()
export class GetProductUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    private readonly cacheService: CacheService,
  ) {}

  async execute(id: string): Promise<ProductResponseDto> {
    const cacheKey = `product:${id}`;

    // Check cache
    const cached = await this.cacheService.get<ProductResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new ProductNotFoundException(id);
    }

    const response = ProductMapper.toResponseDto(product);

    // Cache for 5 minutes
    await this.cacheService.set(cacheKey, response, 300);

    return response;
  }
}
```

### Pagination

```typescript
export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20;
}

@Get()
async findAll(@Query() pagination: PaginationDto) {
  return this.getProductsUseCase.execute(pagination.page, pagination.limit);
}
```

### Database Query Optimization

```typescript
// ✅ GOOD: Use select to limit columns
const users = await this.userRepository
  .createQueryBuilder('user')
  .select(['user.id', 'user.userName', 'user.email'])
  .where('user.role = :role', { role: UserRole.ADMIN })
  .getMany();

// ✅ GOOD: Use eager loading for relations
const posts = await this.postRepository.find({
  relations: ['author', 'comments'],
  where: { status: PostStatus.PUBLISHED },
});

// ❌ BAD: N+1 query problem
const posts = await this.postRepository.find();
for (const post of posts) {
  post.author = await this.userRepository.findById(post.authorId); // N queries!
}
```

## Best Practices

1. ✅ **Use DTOs for all inputs/outputs** - Never expose domain entities
2. ✅ **Validate all inputs** - Use class-validator decorators
3. ✅ **Document with Swagger** - Add @ApiOperation, @ApiResponse
4. ✅ **Handle errors gracefully** - Use custom exceptions
5. ✅ **Implement pagination** - For list endpoints
6. ✅ **Use caching** - For frequently accessed data
7. ✅ **Add authentication** - Protect sensitive endpoints
8. ✅ **Write tests** - Unit + E2E tests
9. ✅ **Follow REST conventions** - Proper HTTP methods and status codes
10. ✅ **Use standard response format** - Consistent API responses

## Next Steps

- [Architecture Guide](./architecture.md) - Understand Clean Architecture layers
- [Testing Guide](./testing.md) - Learn testing strategies
- [Deployment Guide](./deployment.md) - Deploy your APIs
- [CI/CD Guide](./cicd.md) - Automate your workflow
