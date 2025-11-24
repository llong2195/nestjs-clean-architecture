import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserOrmEntity } from './user.orm-entity';
import { UserOrmMapper } from '../mappers/user-orm.mapper';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly ormRepository: Repository<UserOrmEntity>,
    private readonly mapper: UserOrmMapper,
  ) {}

  async save(user: User): Promise<User> {
    const ormEntity = this.mapper.toOrm(user);
    const saved = await this.ormRepository.save(ormEntity);
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { email } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findAll(options?: { skip?: number; take?: number }): Promise<User[]> {
    const ormEntities = await this.ormRepository.find({
      skip: options?.skip || 0,
      take: options?.take || 10,
      order: { createdAt: 'DESC' },
    });
    return this.mapper.toDomainMany(ormEntities);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.ormRepository.softDelete(id);
    return (result.affected || 0) > 0;
  }

  async count(): Promise<number> {
    return this.ormRepository.count();
  }
}
