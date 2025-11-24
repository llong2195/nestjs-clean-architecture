import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../../domain/entities/tag.entity';
import { ITagRepository } from '../../domain/repositories/tag.repository.interface';
import { TagOrmEntity } from './tag.orm-entity';
import { TagOrmMapper } from '../mappers/tag-orm.mapper';

@Injectable()
export class TagRepository implements ITagRepository {
  constructor(
    @InjectRepository(TagOrmEntity)
    private readonly ormRepository: Repository<TagOrmEntity>,
    private readonly mapper: TagOrmMapper,
  ) {}

  async save(tag: Tag): Promise<Tag> {
    const ormEntity = this.mapper.toOrm(tag);
    const saved = await this.ormRepository.save(ormEntity);
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<Tag | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { slug } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByName(name: string): Promise<Tag | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { name } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findAll(): Promise<Tag[]> {
    const ormEntities = await this.ormRepository.find({
      order: { name: 'ASC' },
    });
    return this.mapper.toDomainMany(ormEntities);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.ormRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
