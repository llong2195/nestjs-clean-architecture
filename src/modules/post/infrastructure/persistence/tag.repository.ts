import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../../domain/entities/tag.entity';
import { ITagRepository } from '../../domain/repositories/tag.repository.interface';
import { TagOrmEntity } from './tag.orm-entity';

@Injectable()
export class TagRepository implements ITagRepository {
  constructor(
    @InjectRepository(TagOrmEntity)
    private readonly ormRepository: Repository<TagOrmEntity>,
  ) {}

  async save(tag: Tag): Promise<Tag> {
    const ormEntity = this.toOrmEntity(tag);
    const saved = await this.ormRepository.save(ormEntity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Tag | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { slug } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findByName(name: string): Promise<Tag | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { name } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findAll(): Promise<Tag[]> {
    const ormEntities = await this.ormRepository.find({
      order: { name: 'ASC' },
    });
    return ormEntities.map((entity) => this.toDomain(entity));
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.ormRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private toOrmEntity(tag: Tag): TagOrmEntity {
    const ormEntity = new TagOrmEntity();
    ormEntity.id = tag.id;
    ormEntity.name = tag.name;
    ormEntity.slug = tag.slug;
    return ormEntity;
  }

  private toDomain(ormEntity: TagOrmEntity): Tag {
    return Tag.reconstitute(ormEntity.id, ormEntity.name, ormEntity.slug);
  }
}
