import { Injectable } from '@nestjs/common';
import { Message } from '../../domain/entities/message.entity';
import { MessageOrmEntity } from '../persistence/message.orm-entity';

/**
 * Message Mapper
 *
 * Maps between domain Message entity and TypeORM entity.
 * Follows Clean Architecture: Infrastructure layer knows about domain layer.
 */
@Injectable()
export class MessageMapper {
  /**
   * Convert TypeORM entity to domain entity
   */
  toDomain(ormEntity: MessageOrmEntity): Message {
    return Message.from(
      ormEntity.id,
      ormEntity.conversationId,
      ormEntity.senderId,
      ormEntity.content,
      ormEntity.isDelivered ?? false,
      ormEntity.isRead,
      ormEntity.isEdited,
      ormEntity.createdAt,
      ormEntity.updatedAt,
    );
  }

  /**
   * Convert domain entity to TypeORM entity
   */
  toOrm(domain: Message): MessageOrmEntity {
    const ormEntity = new MessageOrmEntity();
    ormEntity.id = domain.id;
    ormEntity.conversationId = domain.conversationId;
    ormEntity.senderId = domain.senderId;
    ormEntity.content = domain.content;
    ormEntity.isDelivered = domain.isDelivered;
    ormEntity.isRead = domain.isRead;
    ormEntity.isEdited = domain.isEdited;
    ormEntity.createdAt = domain.createdAt;
    ormEntity.updatedAt = domain.updatedAt;

    return ormEntity;
  }

  /**
   * Convert array of TypeORM entities to domain entities
   */
  toDomainList(ormEntities: MessageOrmEntity[]): Message[] {
    return ormEntities.map((entity) => this.toDomain(entity));
  }

  /**
   * Convert array of domain entities to TypeORM entities
   */
  toOrmList(domains: Message[]): MessageOrmEntity[] {
    return domains.map((domain) => this.toOrm(domain));
  }
}
