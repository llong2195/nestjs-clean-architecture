import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserOrmEntity } from '../../../user/infrastructure/persistence/user.orm-entity';

/**
 * Notification ORM Entity
 *
 * TypeORM entity for notifications table.
 * Maps to domain entity via NotificationMapper.
 */
@Entity({ name: 'notifications' })
export class NotificationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: 'pending' | 'sent' | 'failed';

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt!: Date | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relationships
  @ManyToOne(() => UserOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: UserOrmEntity;
}
