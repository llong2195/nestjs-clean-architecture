import { Password } from '../../../../src/modules/user/domain/value-objects/password.vo';

describe('Password Value Object', () => {
  describe('create', () => {
    it('should create password with valid plain text', async () => {
      const plainPassword = 'SecurePass123';

      const password = await Password.create(plainPassword);

      expect(password).toBeDefined();
      expect(password.hashedValue).toBeDefined();
      expect(password.hashedValue).not.toBe(plainPassword);
      expect(password.hashedValue.startsWith('$2b$')).toBe(true); // bcrypt hash format
    });

    it('should create different hashes for same password (salt)', async () => {
      const plainPassword = 'SecurePass123';

      const password1 = await Password.create(plainPassword);
      const password2 = await Password.create(plainPassword);

      expect(password1.hashedValue).not.toBe(password2.hashedValue);
    });

    it('should throw error for empty password', async () => {
      await expect(Password.create('')).rejects.toThrow(
        'Password must be at least 8 characters long',
      );
    });

    it('should throw error for whitespace-only password', async () => {
      await expect(Password.create('   ')).rejects.toThrow(
        'Password must be at least 8 characters long',
      );
    });

    it('should throw error for password shorter than 8 characters', async () => {
      await expect(Password.create('Short1')).rejects.toThrow(
        'Password must be at least 8 characters long',
      );
    });

    it('should throw error for password without uppercase letter', async () => {
      await expect(Password.create('weakpass123')).rejects.toThrow(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      );
    });

    it('should throw error for password without lowercase letter', async () => {
      await expect(Password.create('WEAKPASS123')).rejects.toThrow(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      );
    });

    it('should throw error for password without number', async () => {
      await expect(Password.create('WeakPassword')).rejects.toThrow(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      );
    });

    it('should accept strong password with special characters', async () => {
      const password = await Password.create('Strong!Pass123');

      expect(password.hashedValue).toBeDefined();
    });
  });

  describe('fromHash', () => {
    it('should create password from existing hash', () => {
      const existingHash = '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890';

      const password = Password.fromHash(existingHash);

      expect(password).toBeDefined();
      expect(password.hashedValue).toBe(existingHash);
    });

    it('should throw error for empty hash', () => {
      expect(() => Password.fromHash('')).toThrow('Hashed password cannot be empty');
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const plainPassword = 'SecurePass123';
      const password = await Password.create(plainPassword);

      const isMatch = await password.comparePassword(plainPassword);

      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = await Password.create('SecurePass123');

      const isMatch = await password.comparePassword('WrongPassword123');

      expect(isMatch).toBe(false);
    });

    it('should return false for empty password', async () => {
      const password = await Password.create('SecurePass123');

      const isMatch = await password.comparePassword('');

      expect(isMatch).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const password = await Password.create('SecurePass123');

      const isMatch = await password.comparePassword('securepass123');

      expect(isMatch).toBe(false);
    });

    it('should work with passwords from hash', async () => {
      const plainPassword = 'SecurePass123';
      const password1 = await Password.create(plainPassword);
      const hash = password1.hashedValue;

      const password2 = Password.fromHash(hash);
      const isMatch = await password2.comparePassword(plainPassword);

      expect(isMatch).toBe(true);
    });
  });

  describe('immutability', () => {
    it('should not allow direct modification of hashedValue', async () => {
      const password = await Password.create('SecurePass123');

      expect(() => {
        // @ts-expect-error Testing immutability
        password.hashedValue = 'modified';
      }).toThrow();
    });
  });
});
