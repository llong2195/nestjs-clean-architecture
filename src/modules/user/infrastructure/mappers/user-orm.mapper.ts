import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from '../persistence/user.orm-entity';
import { UserRole } from '../../domain/value-objects/user-role.vo';
import { AuthProvider } from '../../domain/entities/user.entity';

/**
 * UserOrmMapper
 *
 * Maps between User domain entity and UserOrmEntity (TypeORM entity).
 * Follows Clean Architecture by keeping ORM concerns in infrastructure layer.
 */
@Injectable()
export class UserOrmMapper {
  /**
   * Convert domain entity to ORM entity
   */
  toOrm(user: User): UserOrmEntity {
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

  /**
   * Convert ORM entity to domain entity
   */
  toDomain(ormEntity: UserOrmEntity): User {
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

  /**
   * Convert array of ORM entities to array of domain entities
   */
  toDomainMany(ormEntities: UserOrmEntity[]): User[] {
    return ormEntities.map((entity) => this.toDomain(entity));
  }
}
