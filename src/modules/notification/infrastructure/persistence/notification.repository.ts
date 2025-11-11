import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../domain/entities/notification.entity';
import { INotificationRepository } from '../../domain/repositories/notification.repository.interface';
import { NotificationOrmEntity } from './notification.orm-entity';

/**
 * Notification Repository Implementation
 *
 * Infrastructure implementation of the INotificationRepository port.
 * Handles persistence of notifications using TypeORM.
 */
@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    @InjectRepository(NotificationOrmEntity)
    private readonly ormRepository: Repository<NotificationOrmEntity>,
  ) {}

  async save(notification: Notification): Promise<Notification> {
    const ormEntity = this.toOrmEntity(notification);
    const saved = await this.ormRepository.save(ormEntity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Notification | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findByUserId(userId: string, limit = 50): Promise<Notification[]> {
    const ormEntities = await this.ormRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    return ormEntities.map((e) => this.toDomain(e));
  }

  async findPending(limit = 100): Promise<Notification[]> {
    const ormEntities = await this.ormRepository.find({
      where: { status: 'pending' },
      order: { createdAt: 'ASC' },
      take: limit,
    });
    return ormEntities.map((e) => this.toDomain(e));
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.delete(id);
  }

  async markAsSent(id: string): Promise<Notification> {
    await this.ormRepository.update(id, {
      status: 'sent',
      sentAt: new Date(),
    });
    const updated = await this.ormRepository.findOneOrFail({ where: { id } });
    return this.toDomain(updated);
  }

  async markAsFailed(id: string, errorMessage: string): Promise<Notification> {
    await this.ormRepository.update(id, {
      status: 'failed',
      errorMessage,
    });
    const updated = await this.ormRepository.findOneOrFail({ where: { id } });
    return this.toDomain(updated);
  }

  /**
   * Convert ORM entity to domain entity
   */
  private toDomain(ormEntity: NotificationOrmEntity): Notification {
    return new Notification(
      ormEntity.id,
      ormEntity.userId,
      ormEntity.type,
      ormEntity.title,
      ormEntity.message,
      ormEntity.status,
      ormEntity.sentAt,
      ormEntity.createdAt,
      ormEntity.errorMessage ?? undefined,
    );
  }

  /**
   * Convert domain entity to ORM entity
   */
  private toOrmEntity(notification: Notification): NotificationOrmEntity {
    const ormEntity = new NotificationOrmEntity();
    ormEntity.id = notification.id;
    ormEntity.userId = notification.userId;
    ormEntity.type = notification.type;
    ormEntity.title = notification.title;
    ormEntity.message = notification.message;
    ormEntity.status = notification.status;
    ormEntity.sentAt = notification.sentAt;
    ormEntity.createdAt = notification.createdAt;
    ormEntity.errorMessage = notification.errorMessage ?? null;
    return ormEntity;
  }
}
