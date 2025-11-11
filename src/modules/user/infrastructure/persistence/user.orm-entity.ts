import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class UserOrmEntity {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ name: 'email', unique: true, length: 255 })
  email!: string;

  @Column({ name: 'password', nullable: true, length: 255 })
  password!: string | null;

  @Column({ name: 'user_name', length: 100 })
  userName!: string;

  @Column({ name: 'role', type: 'varchar', length: 50, default: 'USER' })
  role!: string;

  @Column({ name: 'provider', type: 'varchar', length: 50, default: 'local' })
  provider!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt!: Date | null;
}
