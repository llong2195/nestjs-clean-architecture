import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity({ name: 'file_metadata' })
export class FileMetadataOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'original_name', length: 255 })
  originalName!: string;

  @Column({ name: 'mime_type', length: 100 })
  mimeType!: string;

  @Column({ name: 'size', type: 'bigint' })
  size!: number;

  @Column({ name: 'storage_key', length: 500, unique: true })
  storageKey!: string;

  @Column({ name: 'url', type: 'text' })
  url!: string;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy!: string;

  @Column({ name: 'uploaded_at', type: 'timestamp' })
  uploadedAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;
}
