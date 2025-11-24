import { Injectable } from '@nestjs/common';
import { Comment } from '../../domain/entities/comment.entity';
import { CommentOrmEntity } from '../persistence/comment.orm-entity';

/**
 * CommentOrmMapper
 *
 * Maps between Comment domain entity and CommentOrmEntity (TypeORM entity).
 */
@Injectable()
export class CommentOrmMapper {
  /**
   * Convert domain entity to ORM entity
   */
  toOrm(comment: Comment): CommentOrmEntity {
    const ormEntity = new CommentOrmEntity();
    ormEntity.id = comment.id;
    ormEntity.postId = comment.postId;
    ormEntity.authorId = comment.authorId;
    ormEntity.content = comment.content;
    ormEntity.createdAt = comment.createdAt;
    return ormEntity;
  }

  /**
   * Convert ORM entity to domain entity
   */
  toDomain(ormEntity: CommentOrmEntity): Comment {
    return Comment.reconstitute(
      ormEntity.id,
      ormEntity.postId,
      ormEntity.authorId,
      ormEntity.content,
      ormEntity.createdAt,
    );
  }

  /**
   * Convert array of ORM entities to array of domain entities
   */
  toDomainMany(ormEntities: CommentOrmEntity[]): Comment[] {
    return ormEntities.map((entity) => this.toDomain(entity));
  }
}
