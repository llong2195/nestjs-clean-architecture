import { Email } from '../../../../src/modules/user/domain/value-objects/email.vo';

describe('Email Value Object', () => {
  describe('create', () => {
    it('should create email with valid address', () => {
      const emailAddress = 'user@example.com';

      const email = Email.create(emailAddress);

      expect(email).toBeDefined();
      expect(email.value).toBe(emailAddress);
    });

    it('should accept email with subdomain', () => {
      const email = Email.create('user@mail.example.com');

      expect(email.value).toBe('user@mail.example.com');
    });

    it('should accept email with plus addressing', () => {
      const email = Email.create('user+tag@example.com');

      expect(email.value).toBe('user+tag@example.com');
    });

    it('should accept email with numbers and dots', () => {
      const email = Email.create('user.123@example.com');

      expect(email.value).toBe('user.123@example.com');
    });

    it('should throw error for empty email', () => {
      expect(() => Email.create('')).toThrow('Email cannot be empty');
    });

    it('should throw error for whitespace-only email', () => {
      expect(() => Email.create('   ')).toThrow('Email cannot be empty');
    });

    it('should throw error for invalid email format - missing @', () => {
      expect(() => Email.create('userexample.com')).toThrow('Invalid email format');
    });

    it('should throw error for invalid email format - missing domain', () => {
      expect(() => Email.create('user@')).toThrow('Invalid email format');
    });

    it('should throw error for invalid email format - missing local part', () => {
      expect(() => Email.create('@example.com')).toThrow('Invalid email format');
    });

    it('should throw error for invalid email format - multiple @', () => {
      expect(() => Email.create('user@@example.com')).toThrow('Invalid email format');
    });

    it('should throw error for invalid email format - spaces', () => {
      expect(() => Email.create('user @example.com')).toThrow('Invalid email format');
    });
  });

  describe('value object equality', () => {
    it('should be equal to another email with same address', () => {
      const email1 = Email.create('user@example.com');
      const email2 = Email.create('user@example.com');

      expect(email1.value).toBe(email2.value);
    });

    it('should not be equal to email with different address', () => {
      const email1 = Email.create('user1@example.com');
      const email2 = Email.create('user2@example.com');

      expect(email1.value).not.toBe(email2.value);
    });

    it('should be immutable', () => {
      const email = Email.create('user@example.com');

      expect(() => {
        // @ts-expect-error Testing immutability
        email.value = 'another@example.com';
      }).toThrow();
    });
  });
});
