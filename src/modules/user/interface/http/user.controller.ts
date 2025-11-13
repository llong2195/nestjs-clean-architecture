import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { GetUserUseCase } from '../../application/use-cases/get-user.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import { CreateUserDto } from '../../application/dtos/create-user.dto';
import { UpdateUserDto } from '../../application/dtos/update-user.dto';
import { UserResponseDto } from '../../application/dtos/user-response.dto';
import { UserMapper } from '../../application/mappers/user.mapper';
import { UserCacheService } from '../../infrastructure/cache/user-cache.service';
import { ApiResponse as ApiResponseType } from '../../../../common/types/response.types';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly cacheService: UserCacheService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponseType<UserResponseDto>> {
    const user = await this.createUserUseCase.execute(createUserDto);
    return {
      status: 'success',
      data: UserMapper.toDto(user),
      meta: {
        timestamp: new Date().toISOString(),
        requestId: '',
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User found',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async findOne(@Param('id') id: string): Promise<ApiResponseType<UserResponseDto>> {
    // Try cache first
    const cachedUser = await this.cacheService.getUser(id);
    if (cachedUser) {
      return {
        status: 'success',
        data: cachedUser,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: '',
        },
      };
    }

    // Cache miss - fetch from database
    const user = await this.getUserUseCase.execute(id);
    const userDto = UserMapper.toDto(user);

    // Cache for future requests
    await this.cacheService.setUser(id, userDto);

    return {
      status: 'success',
      data: userDto,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: '',
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all users with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10)',
    type: Number,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    type: [UserResponseDto],
  })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ApiResponseType<any>> {
    const result = await this.listUsersUseCase.execute({ page, limit });
    return {
      status: 'success',
      data: {
        users: UserMapper.toDtoList(result.data),
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: '',
      },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ApiResponseType<UserResponseDto>> {
    const user = await this.updateUserUseCase.execute(id, updateUserDto);

    // Invalidate cache after update
    await this.cacheService.invalidateAll(id);

    return {
      status: 'success',
      data: UserMapper.toDto(user),
      meta: {
        timestamp: new Date().toISOString(),
        requestId: '',
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete user' })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  async remove(@Param('id') id: string): Promise<void> {
    // Delete user
    await this.deleteUserUseCase.execute(id);

    // Invalidate cache
    await this.cacheService.invalidateUser(id);
  }
}
