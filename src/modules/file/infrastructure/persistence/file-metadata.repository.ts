import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileMetadata } from '../../domain/entities/file-metadata.entity';
import { IFileMetadataRepository } from '../../domain/repositories/file-metadata.repository.interface';
import { FileMetadataOrmEntity } from './file-metadata.orm-entity';

@Injectable()
export class FileMetadataRepository implements IFileMetadataRepository {
  constructor(
    @InjectRepository(FileMetadataOrmEntity)
    private readonly ormRepository: Repository<FileMetadataOrmEntity>,
  ) {}

  async save(file: FileMetadata): Promise<FileMetadata> {
    const ormEntity = new FileMetadataOrmEntity();
    ormEntity.id = file.id;
    ormEntity.originalName = file.originalName;
    ormEntity.mimeType = file.mimeType;
    ormEntity.size = file.size;
    ormEntity.storageKey = file.storageKey;
    ormEntity.url = file.url;
    ormEntity.uploadedBy = file.uploadedBy;
    ormEntity.uploadedAt = file.uploadedAt;

    const saved = await this.ormRepository.save(ormEntity);
    return this.toDomain(saved);
  }

  async findById(id: string): Promise<FileMetadata | null> {
    const ormEntity = await this.ormRepository.findOne({ where: { id } });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findByStorageKey(key: string): Promise<FileMetadata | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { storageKey: key },
    });
    return ormEntity ? this.toDomain(ormEntity) : null;
  }

  async findByUploadedBy(userId: string, limit = 50): Promise<FileMetadata[]> {
    const ormEntities = await this.ormRepository.find({
      where: { uploadedBy: userId },
      take: limit,
      order: { uploadedAt: 'DESC' },
    });
    return ormEntities.map((e) => this.toDomain(e));
  }

  async delete(id: string): Promise<void> {
    await this.ormRepository.softDelete(id);
  }

  private toDomain(ormEntity: FileMetadataOrmEntity): FileMetadata {
    return new FileMetadata(
      ormEntity.id,
      ormEntity.originalName,
      ormEntity.mimeType,
      ormEntity.size,
      ormEntity.storageKey,
      ormEntity.url,
      ormEntity.uploadedBy,
      ormEntity.uploadedAt,
    );
  }
}
