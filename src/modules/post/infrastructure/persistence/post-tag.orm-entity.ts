import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { PostOrmEntity } from './post.orm-entity';
import { TagOrmEntity } from './tag.orm-entity';

@Entity({ name: 'post_tags' })
export class PostTagOrmEntity {
  @PrimaryColumn({ name: 'post_id', type: 'uuid' })
  postId!: string;

  @PrimaryColumn({ name: 'tag_id', type: 'uuid' })
  tagId!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => PostOrmEntity)
  @JoinColumn({ name: 'post_id' })
  post?: PostOrmEntity;

  @ManyToOne(() => TagOrmEntity)
  @JoinColumn({ name: 'tag_id' })
  tag?: TagOrmEntity;
}
