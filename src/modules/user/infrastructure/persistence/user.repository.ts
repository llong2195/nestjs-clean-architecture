import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from './user.orm-entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { AuthProvider } from '../../domain/entities/user.entity';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepository: Repository<UserOrmEntity>,
  ) {}

  async save(user: User): Promise<User> {
    const ormEntity = this.toOrmEntity(user);
    const saved = await this.ormRepository.save(ormEntity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { email } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findAll(options?: { skip?: number; take?: number }): Promise<User[]> {
    const ormEntities = await this.ormRepository.find({
      skip: options?.skip || 0,
      take: options?.take || 10,
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map((entity) => this.toDomain(entity));
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.ormRepository.softDelete(id);
    return (result.affected || 0) > 0;
  }

  async count(): Promise<number> {
    return this.ormRepository.count();
  }

  private toOrmEntity(user: User): UserOrmEntity {
    const ormEntity = new UserOrmEntity();
    ormEntity.id = user.id;
    ormEntity.email = user.email;
    ormEntity.password = user.hashedPassword;
    ormEntity.userName = user.userName;
    ormEntity.role = user.role;
    ormEntity.provider = user.provider;
    ormEntity.isActive = user.isActive;
    ormEntity.createdAt = user.createdAt;
    ormEntity.updatedAt = user.updatedAt;
    return ormEntity;
  }

  private toDomain(ormEntity: UserOrmEntity): User {
    return User.reconstitute(
      ormEntity.id,
      ormEntity.email,
      ormEntity.password,
      ormEntity.userName,
      ormEntity.role as UserRole,
      ormEntity.provider as AuthProvider,
      ormEntity.isActive,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }
}
