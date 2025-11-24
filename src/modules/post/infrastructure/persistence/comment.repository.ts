import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../domain/entities/comment.entity';
import { ICommentRepository } from '../../domain/repositories/comment.repository.interface';
import { CommentOrmEntity } from './comment.orm-entity';
import { CommentOrmMapper } from '../mappers/comment-orm.mapper';

@Injectable()
export class CommentRepository implements ICommentRepository {
  constructor(
    @InjectRepository(CommentOrmEntity)
    private readonly ormRepository: Repository<CommentOrmEntity>,
    private readonly mapper: CommentOrmMapper,
  ) {}

  async save(comment: Comment): Promise<Comment> {
    const ormEntity = this.mapper.toOrm(comment);
    const saved = await this.ormRepository.save(ormEntity);
    return this.mapper.toDomain(saved);
  }

  async findById(id: string): Promise<Comment | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByPostId(postId: string): Promise<Comment[]> {
    const ormEntities = await this.ormRepository.find({
      where: { postId },
      order: { createdAt: 'DESC' },
    });
    return this.mapper.toDomainMany(ormEntities);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.ormRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
