import { v7 as uuidv7 } from 'uuid';
import { Email } from '../value-objects/email.vo';
import { Password } from '../value-objects/password.vo';
import { UserRole } from '../value-objects/user-role.vo';

export type AuthProvider = 'local' | 'google' | 'github';

export class User {
  private constructor(
    public readonly id: string,
    private _email: Email,
    private _password: Password | null,
    private _userName: string,
    private _role: UserRole,
    private _provider: AuthProvider,
    private _isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(
    email: string,
    password: string | null,
    userName: string,
    role: UserRole = UserRole.USER,
    provider: AuthProvider = 'local',
  ): Promise<User> {
    return User.createAsync(email, password, userName, role, provider);
  }

  private static async createAsync(
    email: string,
    password: string | null,
    userName: string,
    role: UserRole = UserRole.USER,
    provider: AuthProvider = 'local',
  ): Promise<User> {
    const emailVo = Email.create(email);
    let passwordVo: Password | null = null;

    if (password) {
      passwordVo = await Password.create(password);
    } else if (provider === 'local') {
      throw new Error('Password is required for local authentication');
    }

    if (!userName || userName.trim().length === 0) {
      throw new Error('User name cannot be empty');
    }

    if (userName.length < 3 || userName.length > 50) {
      throw new Error('User name must be between 3 and 50 characters');
    }

    return new User(
      uuidv7(),
      emailVo,
      passwordVo,
      userName.trim(),
      role,
      provider,
      true,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(
    id: string,
    email: string,
    hashedPassword: string | null,
    userName: string,
    role: UserRole,
    provider: AuthProvider,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date,
  ): User {
    const emailVo = Email.create(email);
    const passwordVo = hashedPassword ? Password.fromHash(hashedPassword) : null;

    return new User(
      id,
      emailVo,
      passwordVo,
      userName,
      role,
      provider,
      isActive,
      createdAt,
      updatedAt,
    );
  }

  updateProfile(userName?: string, email?: string): void {
    if (userName !== undefined) {
      if (!userName || userName.trim().length === 0) {
        throw new Error('User name cannot be empty');
      }
      if (userName.length < 3 || userName.length > 50) {
        throw new Error('User name must be between 3 and 50 characters');
      }
      this._userName = userName.trim();
    }

    if (email !== undefined) {
      this._email = Email.create(email);
    }
  }

  async changePassword(newPassword: string): Promise<void> {
    if (this._provider !== 'local') {
      throw new Error('Cannot change password for OAuth users');
    }
    this._password = await Password.create(newPassword);
  }

  async verifyPassword(plainPassword: string): Promise<boolean> {
    if (!this._password) {
      return false;
    }
    return this._password.comparePassword(plainPassword);
  }

  deactivate(): void {
    this._isActive = false;
  }

  activate(): void {
    this._isActive = true;
  }

  promoteToAdmin(): void {
    this._role = UserRole.ADMIN;
  }

  promoteToModerator(): void {
    this._role = UserRole.MODERATOR;
  }

  demoteToUser(): void {
    this._role = UserRole.USER;
  }

  // Getters
  get email(): string {
    return this._email.value;
  }

  get userName(): string {
    return this._userName;
  }

  get role(): UserRole {
    return this._role;
  }

  get provider(): AuthProvider {
    return this._provider;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get hashedPassword(): string | null {
    return this._password ? this._password.hashedValue : null;
  }
}
