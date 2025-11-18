import { Injectable } from '@nestjs/common';
import { Conversation } from '../../domain/aggregates/conversation.aggregate';
import { ConversationType } from '../../domain/value-objects/conversation-type.vo';
import { ConversationOrmEntity } from '../persistence/conversation.orm-entity';

/**
 * Conversation Mapper
 *
 * Maps between domain Conversation aggregate and TypeORM entity.
 * Follows Clean Architecture: Infrastructure layer knows about domain layer.
 */
@Injectable()
export class ConversationMapper {
  /**
   * Convert TypeORM entity to domain aggregate
   */
  toDomain(ormEntity: ConversationOrmEntity): Conversation {
    const participantIds = ormEntity.participants
      ? ormEntity.participants.map((p) => p.userId)
      : [];

    return Conversation.from(
      ormEntity.id,
      ormEntity.name,
      ormEntity.type as ConversationType,
      ormEntity.createdBy,
      ormEntity.createdAt,
      ormEntity.updatedAt,
      ormEntity.isActive,
      participantIds,
    );
  }

  /**
   * Convert domain aggregate to TypeORM entity
   */
  toOrm(domain: Conversation): ConversationOrmEntity {
    const ormEntity = new ConversationOrmEntity();
    ormEntity.id = domain.id;
    ormEntity.name = domain.name;
    ormEntity.type = domain.type;
    ormEntity.createdBy = domain.createdBy;
    ormEntity.isActive = domain.isActive;
    ormEntity.createdAt = domain.createdAt;
    ormEntity.updatedAt = domain.updatedAt;

    return ormEntity;
  }

  /**
   * Convert array of TypeORM entities to domain aggregates
   */
  toDomainList(ormEntities: ConversationOrmEntity[]): Conversation[] {
    return ormEntities.map((entity) => this.toDomain(entity));
  }

  /**
   * Convert array of domain aggregates to TypeORM entities
   */
  toOrmList(domains: Conversation[]): ConversationOrmEntity[] {
    return domains.map((domain) => this.toOrm(domain));
  }
}
