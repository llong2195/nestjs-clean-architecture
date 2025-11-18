import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConversationOrmEntity } from './conversation.orm-entity';
import { UserOrmEntity } from '../../../user/infrastructure/persistence/user.orm-entity';

/**
 * Message TypeORM Entity
 *
 * Maps message domain entity to database table.
 * Uses snake_case for column names per database conventions.
 */
@Entity({ name: 'messages' })
export class MessageOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'conversation_id', type: 'uuid' })
  conversationId!: string;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId!: string;

  @Column({ name: 'content', type: 'text' })
  content!: string;

  @Column({ name: 'is_delivered', type: 'boolean', default: false })
  isDelivered!: boolean;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead!: boolean;

  @Column({ name: 'is_edited', type: 'boolean', default: false })
  isEdited!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => ConversationOrmEntity, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversation_id' })
  conversation!: ConversationOrmEntity;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'sender_id' })
  sender!: UserOrmEntity;
}
