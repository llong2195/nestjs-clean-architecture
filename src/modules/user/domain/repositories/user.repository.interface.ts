import { User } from '../entities/user.entity';

export interface IUserRepository {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(options?: { skip?: number; take?: number }): Promise<User[]>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
}
