import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../domain/entities/comment.entity';
import { ICommentRepository } from '../../domain/repositories/comment.repository.interface';
import { CommentOrmEntity } from './comment.orm-entity';

@Injectable()
export class CommentRepository implements ICommentRepository {
  constructor(
    @InjectRepository(CommentOrmEntity)
    private readonly ormRepository: Repository<CommentOrmEntity>,
  ) {}

  async save(comment: Comment): Promise<Comment> {
    const ormEntity = this.toOrmEntity(comment);
    const saved = await this.ormRepository.save(ormEntity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Comment | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findByPostId(postId: string): Promise<Comment[]> {
    const ormEntities = await this.ormRepository.find({
      where: { postId },
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map((entity) => this.toDomain(entity));
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.ormRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  private toOrmEntity(comment: Comment): CommentOrmEntity {
    const ormEntity = new CommentOrmEntity();
    ormEntity.id = comment.id;
    ormEntity.postId = comment.postId;
    ormEntity.authorId = comment.authorId;
    ormEntity.content = comment.content;
    ormEntity.createdAt = comment.createdAt;
    return ormEntity;
  }

  private toDomain(ormEntity: CommentOrmEntity): Comment {
    return Comment.reconstitute(
      ormEntity.id,
      ormEntity.postId,
      ormEntity.authorId,
      ormEntity.content,
      ormEntity.createdAt,
    );
  }
}
