import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { Post } from '../../domain/aggregates/post.aggregate';
import { PostOrmEntity } from './post.orm-entity';
import { PostOrmMapper } from '../mappers/post-orm.mapper';

@Injectable()
export class PostRepository implements IPostRepository {
  constructor(
    @InjectRepository(PostOrmEntity)
    private readonly ormRepository: Repository<PostOrmEntity>,
    private readonly dataSource: DataSource,
    private readonly mapper: PostOrmMapper,
  ) {}

  async save(post: Post): Promise<Post> {
    const ormEntity = this.mapper.toOrm(post);
    const saved = await this.ormRepository.save(ormEntity);
    return this.mapper.toDomain(saved);
  }

  /**
   * Save post within a transaction (for atomic operations with domain events)
   * This ensures that if we later implement an outbox pattern for events,
   * the post update and event persistence happen atomically
   */
  async saveWithTransaction(post: Post): Promise<Post> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const ormEntity = this.mapper.toOrm(post);
      const saved = await queryRunner.manager.save(PostOrmEntity, ormEntity);

      // In the future, domain events would be saved here:
      // if (post.domainEvents.length > 0) {
      //   for (const event of post.domainEvents) {
      //     await queryRunner.manager.save(DomainEventOutbox, {
      //       aggregateId: post.id,
      //       eventType: event.constructor.name,
      //       payload: JSON.stringify(event),
      //       occurredAt: event.occurredAt,
      //     });
      //   }
      // }

      await queryRunner.commitTransaction();
      return this.mapper.toDomain(saved);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(id: string): Promise<Post | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findBySlug(slug: string): Promise<Post | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { slug } });
    return ormEntity ? this.mapper.toDomain(ormEntity) : null;
  }

  async findByAuthorId(
    authorId: string,
    options?: { skip?: number; take?: number },
  ): Promise<Post[]> {
    const ormEntities = await this.ormRepository.find({
      where: { authorId },
      skip: options?.skip || 0,
      take: options?.take || 10,
      order: { createdAt: 'DESC' },
    });
    return this.mapper.toDomainMany(ormEntities);
  }

  async findAll(options?: { skip?: number; take?: number }): Promise<Post[]> {
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

  async countByAuthorId(authorId: string): Promise<number> {
    return this.ormRepository.count({ where: { authorId } });
  }
}
