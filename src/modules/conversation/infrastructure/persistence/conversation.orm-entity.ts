import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { UserOrmEntity } from '../../../user/infrastructure/persistence/user.orm-entity';
import { MessageOrmEntity } from './message.orm-entity';
import { ConversationParticipantOrmEntity } from './conversation-participant.orm-entity';

/**
 * Conversation TypeORM Entity
 *
 * Maps conversation domain aggregate to database table.
 * Uses snake_case for column names per database conventions.
 */
@Entity({ name: 'conversations' })
export class ConversationOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'name', type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ name: 'type', type: 'varchar', length: 50 })
  type!: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  // Relationships
  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'created_by' })
  creator!: UserOrmEntity;

  @OneToMany(() => MessageOrmEntity, (message) => message.conversation)
  messages!: MessageOrmEntity[];

  @OneToMany(() => ConversationParticipantOrmEntity, (participant) => participant.conversation)
  participants!: ConversationParticipantOrmEntity[];
}
