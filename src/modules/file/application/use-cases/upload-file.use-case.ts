import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import type { IStorageAdapter } from '../../../../shared/storage/interfaces/storage-adapter.interface';
import { FileMetadata } from '../../domain/entities/file-metadata.entity';
import type { IFileMetadataRepository } from '../../domain/repositories/file-metadata.repository.interface';

/**
 * UploadFileUseCase - Handles file upload logic
 */
@Injectable()
export class UploadFileUseCase {
  constructor(
    @Inject('STORAGE_ADAPTER')
    private readonly storageAdapter: IStorageAdapter,
    @Inject('FILE_METADATA_REPOSITORY')
    private readonly fileRepository: IFileMetadataRepository,
  ) {}

  async execute(file: Express.Multer.File, userId: string): Promise<FileMetadata> {
    // Validate file
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Generate storage key (organized by date)
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const fileId = uuidv4();
    const extension = file.originalname.split('.').pop() || '';
    const storageKey = `files/${year}/${month}/${fileId}.${extension}`;

    // Upload file to storage
    const url = await this.storageAdapter.upload(file.buffer, storageKey, {
      originalName: file.originalname,
      mimeType: file.mimetype,
      uploadedBy: userId,
    });

    // Create file metadata entity
    const fileMetadata = FileMetadata.create(
      fileId,
      file.originalname,
      file.mimetype,
      file.size,
      storageKey,
      url,
      userId,
    );

    // Save metadata to database
    return this.fileRepository.save(fileMetadata);
  }
}
