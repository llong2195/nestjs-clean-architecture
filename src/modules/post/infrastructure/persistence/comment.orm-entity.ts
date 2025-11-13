import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { PostOrmEntity } from './post.orm-entity';
import { UserOrmEntity } from '../../../user/infrastructure/persistence/user.orm-entity';

@Entity({ name: 'comments' })
export class CommentOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'post_id', type: 'uuid' })
  postId!: string;

  @Column({ name: 'author_id', type: 'uuid' })
  authorId!: string;

  @Column({ name: 'content', type: 'text' })
  content!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => PostOrmEntity, (post) => post.comments)
  @JoinColumn({ name: 'post_id' })
  post?: PostOrmEntity;

  @ManyToOne(() => UserOrmEntity)
  @JoinColumn({ name: 'author_id' })
  author?: UserOrmEntity;
}
