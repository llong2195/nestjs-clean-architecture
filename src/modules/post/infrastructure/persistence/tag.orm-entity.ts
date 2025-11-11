import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ name: 'tags' })
export class TagOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'name', type: 'varchar', length: 50, unique: true })
  name!: string;

  @Column({ name: 'slug', type: 'varchar', length: 100, unique: true })
  slug!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;
}
