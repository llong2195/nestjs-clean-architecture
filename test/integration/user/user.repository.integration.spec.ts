import { DataSource, Repository } from 'typeorm';
import { DatabaseTestHelper } from '../../helpers/database-test.helper';
import { User } from '../../../src/modules/user/domain/entities/user.entity';
import { UserRole } from '../../../src/modules/user/domain/value-objects/user-role.vo';
import { UserOrmEntity } from '../../../src/modules/user/infrastructure/persistence/user.orm-entity';
import { UserRepository } from '../../../src/modules/user/infrastructure/persistence/user.repository';

describe('UserRepository Integration Tests', () => {
  let dataSource: DataSource;
  let ormRepository: Repository<UserOrmEntity>;
  let userRepository: UserRepository;

  beforeAll(async () => {
    dataSource = await DatabaseTestHelper.setupDatabase();
    ormRepository = dataSource.getRepository(UserOrmEntity);
    userRepository = new UserRepository(ormRepository);
  }, 60000); // Allow 60s for container startup

  afterAll(async () => {
    await DatabaseTestHelper.teardownDatabase();
  });

  beforeEach(async () => {
    await DatabaseTestHelper.cleanDatabase();
  });

  describe('save', () => {
    it('should save a new user to the database', async () => {
      const user = await User.create(
        'test@example.com',
        'Password123!',
        'Test User',
        UserRole.USER,
      );

      const savedUser = await userRepository.save(user);

      expect(savedUser).toBeDefined();
      expect(savedUser.id).toBe(user.id);
      expect(savedUser.email).toBe('test@example.com');
      expect(savedUser.userName).toBe('Test User');
      expect(savedUser.role).toBe(UserRole.USER);
      expect(savedUser.isActive).toBe(true);

      // Verify in database
      const dbEntity = await ormRepository.findOne({
        where: { id: user.id },
      });
      expect(dbEntity).toBeDefined();
      expect(dbEntity?.email).toBe('test@example.com');
    });

    it('should update an existing user', async () => {
      const user = await User.create(
        'update@example.com',
        'Password123!',
        'Original Name',
        UserRole.USER,
      );
      await userRepository.save(user);

      // Update user
      user.updateProfile('Updated Name');
      const updatedUser = await userRepository.save(user);

      expect(updatedUser.userName).toBe('Updated Name');

      // Verify in database
      const dbEntity = await ormRepository.findOne({
        where: { id: user.id },
      });
      expect(dbEntity?.userName).toBe('Updated Name');
    });
  });

  describe('findById', () => {
    it('should find a user by ID', async () => {
      const user = await User.create(
        'find@example.com',
        'Password123!',
        'Find User',
        UserRole.USER,
      );
      await userRepository.save(user);

      const foundUser = await userRepository.findById(user.id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(user.id);
      expect(foundUser?.email).toBe('find@example.com');
      expect(foundUser?.userName).toBe('Find User');
    });

    it('should return null for non-existent ID', async () => {
      const foundUser = await userRepository.findById('non-existent-id');

      expect(foundUser).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const user = await User.create(
        'email@example.com',
        'Password123!',
        'Email User',
        UserRole.USER,
      );
      await userRepository.save(user);

      const foundUser = await userRepository.findByEmail('email@example.com');

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe('email@example.com');
      expect(foundUser?.userName).toBe('Email User');
    });

    it('should return null for non-existent email', async () => {
      const foundUser = await userRepository.findByEmail('nonexistent@example.com');

      expect(foundUser).toBeNull();
    });

    it('should be case-sensitive for email lookup', async () => {
      const user = await User.create(
        'case@example.com',
        'Password123!',
        'Case User',
        UserRole.USER,
      );
      await userRepository.save(user);

      const foundUpper = await userRepository.findByEmail('CASE@EXAMPLE.COM');

      // PostgreSQL email comparison is case-sensitive by default
      expect(foundUpper).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const user1 = await User.create('user1@example.com', 'Password123!', 'User 1', UserRole.USER);
      const user2 = await User.create(
        'user2@example.com',
        'Password123!',
        'User 2',
        UserRole.ADMIN,
      );
      await userRepository.save(user1);
      await userRepository.save(user2);

      const users = await userRepository.findAll();

      expect(users).toHaveLength(2);
      expect(users.map((u) => u.email)).toContain('user1@example.com');
      expect(users.map((u) => u.email)).toContain('user2@example.com');
    });

    it('should support pagination with skip and take', async () => {
      // Create 5 users
      for (let i = 1; i <= 5; i++) {
        const user = await User.create(
          `user${i}@example.com`,
          'Password123!',
          `User ${i}`,
          UserRole.USER,
        );
        await userRepository.save(user);
      }

      const page1 = await userRepository.findAll({ skip: 0, take: 2 });
      const page2 = await userRepository.findAll({ skip: 2, take: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });

    it('should return empty array when no users exist', async () => {
      const users = await userRepository.findAll();

      expect(users).toEqual([]);
    });

    it('should order by createdAt DESC', async () => {
      const user1 = await User.create('first@example.com', 'Password123!', 'First', UserRole.USER);
      await userRepository.save(user1);

      // Add delay to ensure different createdAt
      await new Promise((resolve) => setTimeout(resolve, 10));

      const user2 = await User.create(
        'second@example.com',
        'Password123!',
        'Second',
        UserRole.USER,
      );
      await userRepository.save(user2);

      const users = await userRepository.findAll();

      expect(users[0].email).toBe('second@example.com'); // Most recent first
      expect(users[1].email).toBe('first@example.com');
    });
  });

  describe('delete', () => {
    it('should soft delete a user', async () => {
      const user = await User.create(
        'delete@example.com',
        'Password123!',
        'Delete User',
        UserRole.USER,
      );
      await userRepository.save(user);

      const deleted = await userRepository.delete(user.id);

      expect(deleted).toBe(true);

      // Verify soft delete - user should not be found by normal queries
      const foundUser = await userRepository.findById(user.id);
      expect(foundUser).toBeNull();

      // Verify user still exists with deletedAt set
      const dbEntity = await ormRepository.findOne({
        where: { id: user.id },
        withDeleted: true,
      });
      expect(dbEntity).toBeDefined();
      expect(dbEntity?.deletedAt).toBeDefined();
    });

    it('should return false when deleting non-existent user', async () => {
      const deleted = await userRepository.delete('non-existent-id');

      expect(deleted).toBe(false);
    });
  });

  describe('count', () => {
    it('should count total users', async () => {
      expect(await userRepository.count()).toBe(0);

      const user1 = await User.create(
        'count1@example.com',
        'Password123!',
        'Count 1',
        UserRole.USER,
      );
      await userRepository.save(user1);

      expect(await userRepository.count()).toBe(1);

      const user2 = await User.create(
        'count2@example.com',
        'Password123!',
        'Count 2',
        UserRole.USER,
      );
      await userRepository.save(user2);

      expect(await userRepository.count()).toBe(2);
    });

    it('should not count soft-deleted users', async () => {
      const user = await User.create(
        'count@example.com',
        'Password123!',
        'Count User',
        UserRole.USER,
      );
      await userRepository.save(user);

      expect(await userRepository.count()).toBe(1);

      await userRepository.delete(user.id);

      expect(await userRepository.count()).toBe(0);
    });
  });

  describe('domain mapping', () => {
    it('should correctly map domain User to ORM entity and back', async () => {
      const user = await User.create(
        'mapping@example.com',
        'Password123!',
        'Mapping User',
        UserRole.ADMIN,
      );
      user.deactivate();

      const savedUser = await userRepository.save(user);

      expect(savedUser.email).toBe(user.email);
      expect(savedUser.userName).toBe(user.userName);
      expect(savedUser.role).toBe(UserRole.ADMIN);
      expect(savedUser.isActive).toBe(false);
      expect(savedUser.provider).toBe('local');

      // Verify password hash is preserved
      expect(savedUser.hashedPassword).toBe(user.hashedPassword);
    });
  });
});
