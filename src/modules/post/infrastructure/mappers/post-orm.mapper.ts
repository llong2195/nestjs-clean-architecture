import { Injectable } from '@nestjs/common';
import { Post } from '../../domain/aggregates/post.aggregate';
import { PostOrmEntity } from '../persistence/post.orm-entity';
import { PostStatus } from '../../domain/value-objects/post-status.vo';

/**
 * PostOrmMapper
 *
 * Maps between Post aggregate root and PostOrmEntity (TypeORM entity).
 */
@Injectable()
export class PostOrmMapper {
  /**
   * Convert domain aggregate to ORM entity
   */
  toOrm(post: Post): PostOrmEntity {
    const ormEntity = new PostOrmEntity();
    ormEntity.id = post.id;
    ormEntity.authorId = post.authorId;
    ormEntity.title = post.title;
    ormEntity.content = post.content;
    ormEntity.slug = post.slug;
    ormEntity.status = post.status;
    ormEntity.publishedAt = post.publishedAt;
    ormEntity.viewCount = post.viewCount;
    ormEntity.createdAt = post.createdAt;
    ormEntity.updatedAt = post.updatedAt;
    return ormEntity;
  }

  /**
   * Convert ORM entity to domain aggregate
   */
  toDomain(ormEntity: PostOrmEntity): Post {
    return Post.reconstitute(
      ormEntity.id,
      ormEntity.authorId,
      ormEntity.title,
      ormEntity.content,
      ormEntity.slug,
      ormEntity.status as PostStatus,
      ormEntity.publishedAt,
      ormEntity.viewCount,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  /**
   * Convert array of ORM entities to array of domain aggregates
   */
  toDomainMany(ormEntities: PostOrmEntity[]): Post[] {
    return ormEntities.map((entity) => this.toDomain(entity));
  }
}
