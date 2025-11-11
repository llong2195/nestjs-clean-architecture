import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface';
import { Post } from '../../domain/aggregates/post.aggregate';
import { PostOrmEntity } from './post.orm-entity';
import { PostStatus } from '../../domain/value-objects/post-status.vo';

@Injectable()
export class PostRepository implements IPostRepository {
  constructor(
    @InjectRepository(PostOrmEntity)
    private readonly ormRepository: Repository<PostOrmEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async save(post: Post): Promise<Post> {
    const ormEntity = this.toOrmEntity(post);
    const saved = await this.ormRepository.save(ormEntity);
    return this.toDomain(saved);
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
      const ormEntity = this.toOrmEntity(post);
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
      return this.toDomain(saved);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(id: string): Promise<Post | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findBySlug(slug: string): Promise<Post | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { slug } });
    return ormEntity ? this.toDomain(ormEntity) : null;
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
    return ormEntities.map((entity) => this.toDomain(entity));
  }

  async findAll(options?: { skip?: number; take?: number }): Promise<Post[]> {
    const ormEntities = await this.ormRepository.find({
      skip: options?.skip || 0,
      take: options?.take || 10,
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map((entity) => this.toDomain(entity));
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

  private toOrmEntity(post: Post): PostOrmEntity {
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

  private toDomain(ormEntity: PostOrmEntity): Post {
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
}
