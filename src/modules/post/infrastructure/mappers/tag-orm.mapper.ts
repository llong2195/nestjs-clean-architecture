import { Injectable } from '@nestjs/common';
import { Tag } from '../../domain/entities/tag.entity';
import { TagOrmEntity } from '../persistence/tag.orm-entity';

/**
 * TagOrmMapper
 *
 * Maps between Tag domain entity and TagOrmEntity (TypeORM entity).
 */
@Injectable()
export class TagOrmMapper {
  /**
   * Convert domain entity to ORM entity
   */
  toOrm(tag: Tag): TagOrmEntity {
    const ormEntity = new TagOrmEntity();
    ormEntity.id = tag.id;
    ormEntity.name = tag.name;
    ormEntity.slug = tag.slug;
    return ormEntity;
  }

  /**
   * Convert ORM entity to domain entity
   */
  toDomain(ormEntity: TagOrmEntity): Tag {
    return Tag.reconstitute(ormEntity.id, ormEntity.name, ormEntity.slug);
  }

  /**
   * Convert array of ORM entities to array of domain entities
   */
  toDomainMany(ormEntities: TagOrmEntity[]): Tag[] {
    return ormEntities.map((entity) => this.toDomain(entity));
  }
}
