import * as bcrypt from 'bcrypt';

export class Password {
  private readonly _hashedValue: string;

  private constructor(hashedValue: string) {
    this._hashedValue = hashedValue;
  }

  static async create(plainPassword: string): Promise<Password> {
    if (!plainPassword || plainPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    // Validate password strength: at least one uppercase, one lowercase, one number
    const hasUpperCase = /[A-Z]/.test(plainPassword);
    const hasLowerCase = /[a-z]/.test(plainPassword);
    const hasNumber = /[0-9]/.test(plainPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      throw new Error(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      );
    }

    const saltRounds = 10;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const hashedPassword = (await bcrypt.hash(plainPassword, saltRounds)) as string;

    return new Password(hashedPassword);
  }

  static fromHash(hashedPassword: string): Password {
    if (!hashedPassword || hashedPassword.trim().length === 0) {
      throw new Error('Hashed password cannot be empty');
    }
    return new Password(hashedPassword);
  }

  async comparePassword(plainPassword: string): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    return await bcrypt.compare(plainPassword, this._hashedValue);
  }

  get hashedValue(): string {
    return this._hashedValue;
  }

  toString(): string {
    return '[PROTECTED]';
  }
}
