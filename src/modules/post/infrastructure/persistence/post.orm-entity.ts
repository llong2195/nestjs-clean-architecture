import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { UserOrmEntity } from '../../../user/infrastructure/persistence/user.orm-entity';
import { CommentOrmEntity } from './comment.orm-entity';

@Entity({ name: 'posts' })
export class PostOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ name: 'title', type: 'varchar', length: 200 })
  title!: string;

  @Column({ name: 'content', type: 'text' })
  content!: string;

  @Column({ name: 'slug', type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ name: 'status', type: 'varchar', length: 50, default: 'DRAFT' })
  status!: string;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt!: Date | null;

  @Column({ name: 'view_count', type: 'integer', default: 0 })
  viewCount!: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt!: Date | null;

  // Relations
  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'author_id' })
  author?: UserOrmEntity;

  @OneToMany(() => CommentOrmEntity, (comment) => comment.post)
  comments?: CommentOrmEntity[];
}
