import { FileMetadata } from '../entities/file-metadata.entity';

export interface IFileMetadataRepository {
  save(file: FileMetadata): Promise<FileMetadata>;
  findById(id: string): Promise<FileMetadata | null>;
  findByStorageKey(key: string): Promise<FileMetadata | null>;
  findByUploadedBy(userId: string, limit?: number): Promise<FileMetadata[]>;
  delete(id: string): Promise<void>;
}
