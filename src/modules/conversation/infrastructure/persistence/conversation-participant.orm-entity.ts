import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ConversationOrmEntity } from './conversation.orm-entity';
import { UserOrmEntity } from '../../../user/infrastructure/persistence/user.orm-entity';

/**
 * Conversation Participant Junction Table
 *
 * Explicit junction table for many-to-many relationship between
 * conversations and users (participants).
 * Follows Clean Architecture principle: no @ManyToMany decorator.
 *
 * Tracks participant lifecycle:
 * - joined_at: When participant joined the conversation
 * - left_at: When participant left (NULL = still active, soft delete)
 * - last_read_at: Last time participant read messages (for unread count calculation)
 */
@Entity({ name: 'conversation_participants' })
export class ConversationParticipantOrmEntity {
  @PrimaryColumn({ name: 'conversation_id', type: 'uuid' })
  conversationId!: string;

  @PrimaryColumn({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({
    name: 'joined_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  joinedAt!: Date;

  @Column({ name: 'left_at', type: 'timestamp', nullable: true })
  leftAt?: Date | null;

  @Column({
    name: 'last_read_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastReadAt!: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  // Relationships
  @ManyToOne(() => ConversationOrmEntity, (conversation) => conversation.participants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: ConversationOrmEntity;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'user_id' })
  user!: UserOrmEntity;
}
