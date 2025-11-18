import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IConversationRepository } from '../../domain/repositories/conversation.repository.interface';
import { Conversation } from '../../domain/aggregates/conversation.aggregate';
import { Message } from '../../domain/entities/message.entity';
import { ConversationType } from '../../domain/value-objects/conversation-type.vo';
import { ConversationOrmEntity } from './conversation.orm-entity';
import { MessageOrmEntity } from './message.orm-entity';
import { ConversationParticipantOrmEntity } from './conversation-participant.orm-entity';
import { ConversationMapper } from '../mappers/conversation.mapper';
import { MessageMapper } from '../mappers/message.mapper';

/**
 * Conversation Repository Implementation
 *
 * Adapter that implements the domain repository interface using TypeORM.
 * Handles ORM ↔ Domain mapping via dedicated mappers.
 */
@Injectable()
export class ConversationRepository implements IConversationRepository {
  constructor(
    @InjectRepository(ConversationOrmEntity)
    private readonly conversationRepo: Repository<ConversationOrmEntity>,
    @InjectRepository(MessageOrmEntity)
    private readonly messageRepo: Repository<MessageOrmEntity>,
    @InjectRepository(ConversationParticipantOrmEntity)
    private readonly participantRepo: Repository<ConversationParticipantOrmEntity>,
    private readonly conversationMapper: ConversationMapper,
    private readonly messageMapper: MessageMapper,
  ) {}

  /**
   * Save a conversation (create or update)
   * T014: Implements save method
   */
  async save(conversation: Conversation): Promise<Conversation> {
    const ormEntity = this.conversationMapper.toOrm(conversation);
    const saved = await this.conversationRepo.save(ormEntity);

    // Save participant associations
    const existingParticipants = await this.participantRepo.find({
      where: { conversationId: conversation.id },
    });

    const existingParticipantIds = existingParticipants.map((p) => p.userId);
    const newParticipantIds = conversation.participantIds.filter(
      (id) => !existingParticipantIds.includes(id),
    );

    // Add new participants
    if (newParticipantIds.length > 0) {
      const newParticipants = newParticipantIds.map((userId) => {
        const participant = new ConversationParticipantOrmEntity();
        participant.conversationId = conversation.id;
        participant.userId = userId;
        participant.joinedAt = new Date();
        return participant;
      });
      await this.participantRepo.save(newParticipants);
    }

    // Load full entity with participants
    const fullEntity = await this.conversationRepo.findOne({
      where: { id: saved.id },
      relations: ['participants'],
    });

    return this.conversationMapper.toDomain(fullEntity!);
  }

  /**
   * Find conversation by ID
   * T014: Implements findById method
   */
  async findById(id: string): Promise<Conversation | null> {
    const entity = await this.conversationRepo.findOne({
      where: { id },
      relations: ['participants'],
    });

    return entity ? this.conversationMapper.toDomain(entity) : null;
  }

  /**
   * Find direct conversation between two users
   * T014: Implements findByParticipants method
   */
  async findDirectConversation(userId1: string, userId2: string): Promise<Conversation | null> {
    // Find conversations where both users are participants
    const conversations = await this.conversationRepo
      .createQueryBuilder('c')
      .innerJoin('c.participants', 'p1', 'p1.userId = :userId1', { userId1 })
      .innerJoin('c.participants', 'p2', 'p2.userId = :userId2', { userId2 })
      .where('c.type = :type', { type: ConversationType.DIRECT })
      .leftJoinAndSelect('c.participants', 'allParticipants')
      .getMany();

    if (conversations.length === 0) {
      return null;
    }

    return this.conversationMapper.toDomain(conversations[0]);
  }

  /**
   * Find all conversations for a user
   * T014: Implements findByUser method
   */
  async findByUserId(userId: string): Promise<Conversation[]> {
    const entities = await this.conversationRepo
      .createQueryBuilder('c')
      .innerJoin('c.participants', 'p', 'p.userId = :userId AND p.leftAt IS NULL', { userId })
      .leftJoinAndSelect('c.participants', 'allParticipants')
      .orderBy('c.updatedAt', 'DESC')
      .getMany();

    return this.conversationMapper.toDomainList(entities);
  }

  /**
   * Find conversations by type
   */
  async findByType(type: ConversationType): Promise<Conversation[]> {
    const entities = await this.conversationRepo.find({
      where: { type },
      relations: ['participants'],
    });

    return this.conversationMapper.toDomainList(entities);
  }

  /**
   * Get unread message count for a user in a conversation
   * T014: Implements getUnreadCount method
   */
  async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    // Get user's last_read_at timestamp
    const participant = await this.participantRepo.findOne({
      where: { conversationId, userId },
    });

    if (!participant) {
      return 0;
    }

    // Count messages created after last_read_at that weren't sent by the user
    const count = await this.messageRepo
      .createQueryBuilder('m')
      .where('m.conversationId = :conversationId', { conversationId })
      .andWhere('m.senderId != :userId', { userId })
      .andWhere('m.createdAt > :lastReadAt', { lastReadAt: participant.lastReadAt })
      .getCount();

    return count;
  }

  /**
  /**
   * T015: Search messages using PostgreSQL full-text search (tsvector)
   * T077-T079: Enhanced for User Story 5 - cross-conversation search with authorization
   */
  async searchMessages(
    conversationId: string,
    searchQuery: string,
    limit: number = 50,
  ): Promise<Message[]> {
    const entities = await this.messageRepo
      .createQueryBuilder('m')
      .where('m.conversationId = :conversationId', { conversationId })
      .andWhere("m.search_vector @@ plainto_tsquery('english', :query)", { query: searchQuery })
      .orderBy("ts_rank(m.search_vector, plainto_tsquery('english', :query))", 'DESC')
      .addOrderBy('m.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return this.messageMapper.toDomainList(entities);
  }

  /**
   * T077-T079: Search messages across all user's conversations
   * Full-text search using PostgreSQL tsvector with authorization and ranking
   *
   * @param userId - User ID for authorization (only search conversations user participates in)
   * @param searchQuery - Search query text
   * @param limit - Maximum results (default: 50)
   * @returns Array of messages with relevance scores
   */
  async searchMessagesAcrossConversations(
    userId: string,
    searchQuery: string,
    limit: number = 50,
  ): Promise<Array<Message & { rank: number; conversationId: string }>> {
    // T078: User authorization filter - only search conversations user participates in
    const query = this.messageRepo
      .createQueryBuilder('message')
      .innerJoin('conversation_participants', 'cp', 'cp.conversation_id = message.conversation_id')
      .where('cp.user_id = :userId', { userId })
      .andWhere("message.search_vector @@ plainto_tsquery('english', :query)", {
        query: searchQuery,
      })
      // T079: Relevance sorting with ts_rank
      .orderBy("ts_rank(message.search_vector, plainto_tsquery('english', :query))", 'DESC')
      .addOrderBy('message.created_at', 'DESC')
      // T079: Result limiting
      .take(limit);

    const entities = await query.getMany();

    // Calculate rank for each message
    const messagesWithRank: Array<Message & { rank: number; conversationId: string }> = [];

    for (const entity of entities) {
      // Get rank score using separate query (TypeORM limitation)
      const rankResult = await this.messageRepo
        .createQueryBuilder('m')
        .select("ts_rank(m.search_vector, plainto_tsquery('english', :query))", 'rank')
        .where('m.id = :id', { id: entity.id })
        .setParameter('query', searchQuery)
        .getRawOne<{ rank: string }>();

      const domainEntity = this.messageMapper.toDomain(entity);
      const rank = rankResult ? parseFloat(rankResult.rank) : 0;

      messagesWithRank.push(
        Object.assign(domainEntity, {
          rank,
          conversationId: entity.conversationId,
        }),
      );
    }

    return messagesWithRank;
  }

  /**
   * Save a message within a conversation
   */
  async saveMessage(message: Message): Promise<Message> {
    const ormEntity = this.messageMapper.toOrm(message);
    const saved = await this.messageRepo.save(ormEntity);

    // Update conversation's updated_at timestamp
    await this.conversationRepo.update({ id: message.conversationId }, { updatedAt: new Date() });

    return this.messageMapper.toDomain(saved);
  }

  /**
   * Find messages in a conversation with pagination
   */
  async findMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Message[]> {
    const entities = await this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return this.messageMapper.toDomainList(entities);
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    await this.messageRepo.update({ id: messageId }, { isRead: true });
  }

  /**
   * Mark all messages as read for a user in a conversation
   * Used by MarkMessagesAsReadUseCase (User Story 2)
   */
  async markMessagesAsRead(
    conversationId: string,
    userId: string,
    lastReadAt: Date,
  ): Promise<void> {
    // Mark all messages sent before lastReadAt that were not sent by the user
    await this.messageRepo
      .createQueryBuilder()
      .update(MessageOrmEntity)
      .set({ isRead: true })
      .where('conversation_id = :conversationId', { conversationId })
      .andWhere('sender_id != :userId', { userId })
      .andWhere('created_at <= :lastReadAt', { lastReadAt })
      .andWhere('is_read = false')
      .execute();
  }

  /**
   * Get last message in a conversation
   * Used by GetConversationListUseCase (User Story 4)
   */
  async getLastMessage(conversationId: string): Promise<Message | null> {
    const entity = await this.messageRepo.findOne({
      where: { conversationId },
      order: { createdAt: 'DESC' },
    });

    return entity ? this.messageMapper.toDomain(entity) : null;
  }

  /**
   * Delete a conversation
   */
  async delete(id: string): Promise<void> {
    await this.conversationRepo.delete({ id });
  }
}
