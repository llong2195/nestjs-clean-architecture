/* eslint-disable @typescript-eslint/unbound-method */
import { CreateUserUseCase } from '../../../../src/modules/user/application/use-cases/create-user.use-case';
import type { IUserRepository } from '../../../../src/modules/user/domain/repositories/user.repository.interface';
import { User } from '../../../../src/modules/user/domain/entities/user.entity';
import { CreateUserDto } from '../../../../src/modules/user/application/dtos/create-user.dto';
import { UserRole } from '../../../../src/modules/user/domain/value-objects/user-role.vo';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    } as jest.Mocked<IUserRepository>;

    useCase = new CreateUserUseCase(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should create a new user successfully', async () => {
      const dto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        userName: 'newuser',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation(async (user) => await Promise.resolve(user));

      const result = await useCase.execute(dto);

      expect(result).toBeDefined();
      expect(result.email).toBe(dto.email);
      expect(result.userName).toBe(dto.userName);
      expect(result.role).toBe(UserRole.USER);
      expect(result.provider).toBe('local');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should create user with custom role', async () => {
      const dto: CreateUserDto = {
        email: 'admin@example.com',
        password: 'AdminPass123',
        userName: 'admin',
        role: UserRole.ADMIN,
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation(async (user) => await Promise.resolve(user));

      const result = await useCase.execute(dto);

      expect(result.role).toBe(UserRole.ADMIN);
    });

    it('should throw error if user with email already exists', async () => {
      const dto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'SecurePass123',
        userName: 'existinguser',
      };

      const existingUser = await User.create(
        'existing@example.com',
        'ExistingPass123',
        'existinguser',
      );

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(useCase.execute(dto)).rejects.toThrow('User with this email already exists');
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const dto: CreateUserDto = {
        email: 'invalid-email',
        password: 'SecurePass123',
        userName: 'testuser',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow('Invalid email format');
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should validate password strength', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'weak',
        userName: 'testuser',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(
        'Password must be at least 8 characters long',
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should validate user name constraints', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'SecurePass123',
        userName: 'ab', // Too short
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(useCase.execute(dto)).rejects.toThrow(
        'User name must be between 3 and 50 characters',
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should persist user with hashed password', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'SecurePass123',
        userName: 'testuser',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation(async (user) => await Promise.resolve(user));

      const result = await useCase.execute(dto);

      expect(result.hashedPassword).toBeDefined();
      expect(result.hashedPassword).not.toBe(dto.password);
      expect(result.hashedPassword?.startsWith('$2b$')).toBe(true);
    });

    it('should handle repository save errors', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'SecurePass123',
        userName: 'testuser',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockRejectedValue(new Error('Database connection failed'));

      await expect(useCase.execute(dto)).rejects.toThrow('Database connection failed');
    });

    it('should set correct default values', async () => {
      const dto: CreateUserDto = {
        email: 'test@example.com',
        password: 'SecurePass123',
        userName: 'testuser',
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.save.mockImplementation(async (user) => await Promise.resolve(user));

      const result = await useCase.execute(dto);

      expect(result.role).toBe(UserRole.USER);
      expect(result.provider).toBe('local');
      expect(result.isActive).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });
});
