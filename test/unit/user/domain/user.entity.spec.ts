import { User } from '../../../../src/modules/user/domain/entities/user.entity';
import { UserRole } from '../../../../src/modules/user/domain/value-objects/user-role.vo';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a new user with valid data', async () => {
      const email = 'test@example.com';
      const password = 'SecurePass123';
      const userName = 'testuser';

      const user = await User.create(email, password, userName);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.userName).toBe(userName);
      expect(user.role).toBe(UserRole.USER);
      expect(user.provider).toBe('local');
      expect(user.isActive).toBe(true);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a user with custom role', async () => {
      const user = await User.create('admin@example.com', 'AdminPass123', 'admin', UserRole.ADMIN);

      expect(user.role).toBe(UserRole.ADMIN);
    });

    it('should create a user with OAuth provider', async () => {
      const user = await User.create(
        'google@example.com',
        null,
        'googleuser',
        UserRole.USER,
        'google',
      );

      expect(user.provider).toBe('google');
      expect(user.hashedPassword).toBeNull();
    });

    it('should throw error if password is null for local provider', async () => {
      await expect(User.create('local@example.com', null, 'localuser')).rejects.toThrow(
        'Password is required for local authentication',
      );
    });

    it('should throw error for invalid email', async () => {
      await expect(User.create('invalid-email', 'SecurePass123', 'user')).rejects.toThrow();
    });

    it('should throw error for weak password', async () => {
      await expect(User.create('test@example.com', 'weak', 'user')).rejects.toThrow();
    });

    it('should throw error for empty user name', async () => {
      await expect(User.create('test@example.com', 'SecurePass123', '')).rejects.toThrow(
        'User name cannot be empty',
      );
    });

    it('should throw error for user name too short', async () => {
      await expect(User.create('test@example.com', 'SecurePass123', 'ab')).rejects.toThrow(
        'User name must be between 3 and 50 characters',
      );
    });

    it('should throw error for user name too long', async () => {
      const longName = 'a'.repeat(51);
      await expect(User.create('test@example.com', 'SecurePass123', longName)).rejects.toThrow(
        'User name must be between 3 and 50 characters',
      );
    });
  });

  describe('updateProfile', () => {
    it('should update user name', async () => {
      const user = await User.create('test@example.com', 'SecurePass123', 'oldname');

      user.updateProfile('newname');

      expect(user.userName).toBe('newname');
    });

    it('should update email', async () => {
      const user = await User.create('old@example.com', 'SecurePass123', 'testuser');

      user.updateProfile(undefined, 'new@example.com');

      expect(user.email).toBe('new@example.com');
    });

    it('should update both user name and email', async () => {
      const user = await User.create('old@example.com', 'SecurePass123', 'oldname');

      user.updateProfile('newname', 'new@example.com');

      expect(user.userName).toBe('newname');
      expect(user.email).toBe('new@example.com');
    });

    it('should throw error for invalid email', async () => {
      const user = await User.create('test@example.com', 'SecurePass123', 'testuser');

      expect(() => user.updateProfile(undefined, 'invalid-email')).toThrow();
    });

    it('should throw error for empty user name', async () => {
      const user = await User.create('test@example.com', 'SecurePass123', 'testuser');

      expect(() => user.updateProfile('')).toThrow('User name cannot be empty');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const user = await User.create('test@example.com', 'OldPass123', 'testuser');

      const oldPasswordHash = user.hashedPassword;

      await user.changePassword('NewPass123');

      expect(user.hashedPassword).not.toBe(oldPasswordHash);
      expect(user.hashedPassword).not.toBeNull();
    });

    it('should throw error for weak new password', async () => {
      const user = await User.create('test@example.com', 'OldPass123', 'testuser');

      await expect(user.changePassword('weak')).rejects.toThrow();
    });

    it('should throw error when trying to change password for OAuth users', async () => {
      const user = await User.create(
        'google@example.com',
        null,
        'googleuser',
        UserRole.USER,
        'google',
      );

      await expect(user.changePassword('NewPass123')).rejects.toThrow(
        'Cannot change password for OAuth users',
      );
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const user = await User.create('test@example.com', 'SecurePass123', 'testuser');

      const isValid = await user.verifyPassword('SecurePass123');

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = await User.create('test@example.com', 'SecurePass123', 'testuser');

      const isValid = await user.verifyPassword('WrongPassword');

      expect(isValid).toBe(false);
    });

    it('should return false for OAuth users without password', async () => {
      const user = await User.create(
        'google@example.com',
        null,
        'googleuser',
        UserRole.USER,
        'google',
      );

      const isValid = await user.verifyPassword('anypassword');

      expect(isValid).toBe(false);
    });
  });

  describe('activate and deactivate', () => {
    it('should activate user', async () => {
      const user = await User.create('test@example.com', 'SecurePass123', 'testuser');

      user.deactivate();
      user.activate();

      expect(user.isActive).toBe(true);
    });

    it('should deactivate user', async () => {
      const user = await User.create('test@example.com', 'SecurePass123', 'testuser');

      user.deactivate();

      expect(user.isActive).toBe(false);
    });

    it('should create active user by default', async () => {
      const user = await User.create('test@example.com', 'SecurePass123', 'testuser');

      expect(user.isActive).toBe(true);
    });
  });

  describe('role management', () => {
    it('should promote user to admin', async () => {
      const user = await User.create('test@example.com', 'SecurePass123', 'testuser');

      user.promoteToAdmin();

      expect(user.role).toBe(UserRole.ADMIN);
    });

    it('should promote user to moderator', async () => {
      const user = await User.create('test@example.com', 'SecurePass123', 'testuser');

      user.promoteToModerator();

      expect(user.role).toBe(UserRole.MODERATOR);
    });

    it('should demote user back to user role', async () => {
      const user = await User.create(
        'test@example.com',
        'SecurePass123',
        'testuser',
        UserRole.ADMIN,
      );

      user.demoteToUser();

      expect(user.role).toBe(UserRole.USER);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute user from persistence data', () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const email = 'test@example.com';
      const hashedPassword = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890';
      const userName = 'testuser';
      const role = UserRole.USER;
      const provider = 'local' as const;
      const isActive = true;
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      const user = User.reconstitute(
        id,
        email,
        hashedPassword,
        userName,
        role,
        provider,
        isActive,
        createdAt,
        updatedAt,
      );

      expect(user.id).toBe(id);
      expect(user.email).toBe(email);
      expect(user.userName).toBe(userName);
      expect(user.role).toBe(role);
      expect(user.provider).toBe(provider);
      expect(user.isActive).toBe(isActive);
      expect(user.createdAt).toBe(createdAt);
      expect(user.updatedAt).toBe(updatedAt);
      expect(user.hashedPassword).toBe(hashedPassword);
    });

    it('should reconstitute OAuth user without password', () => {
      const user = User.reconstitute(
        '123e4567-e89b-12d3-a456-426614174000',
        'google@example.com',
        null,
        'googleuser',
        UserRole.USER,
        'google',
        true,
        new Date(),
        new Date(),
      );

      expect(user.provider).toBe('google');
      expect(user.hashedPassword).toBeNull();
    });
  });
});
