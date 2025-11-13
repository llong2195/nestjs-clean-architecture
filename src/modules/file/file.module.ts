import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StorageModule } from '../../shared/storage/storage.module';
import { FileMetadataOrmEntity } from './infrastructure/persistence/file-metadata.orm-entity';
import { FileMetadataRepository } from './infrastructure/persistence/file-metadata.repository';
import { UploadFileUseCase } from './application/use-cases/upload-file.use-case';
import { FileController } from './interface/http/file.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FileMetadataOrmEntity]), StorageModule],
  controllers: [FileController],
  providers: [
    {
      provide: 'FILE_METADATA_REPOSITORY',
      useClass: FileMetadataRepository,
    },
    UploadFileUseCase,
  ],
  exports: ['FILE_METADATA_REPOSITORY'],
})
export class FileModule {}
