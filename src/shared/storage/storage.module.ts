import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { AppConfigService } from '../config/config.service';
import { LocalStorageAdapter } from './adapters/local-storage.adapter';
import { S3StorageAdapter } from './adapters/s3-storage.adapter';
import { IStorageAdapter } from './interfaces/storage-adapter.interface';

/**
 * StorageModule - File storage module
 * Provides file storage using local filesystem or AWS S3
 * Storage type is determined by STORAGE_TYPE environment variable
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LocalStorageAdapter,
    S3StorageAdapter,
    {
      provide: 'STORAGE_ADAPTER',
      useFactory: (
        configService: AppConfigService,
        localAdapter: LocalStorageAdapter,
        s3Adapter: S3StorageAdapter,
      ): IStorageAdapter => {
        const storageType = configService.storageType;

        if (storageType === 's3') {
          return s3Adapter;
        }

        return localAdapter;
      },
      inject: [AppConfigService, LocalStorageAdapter, S3StorageAdapter],
    },
  ],
  exports: ['STORAGE_ADAPTER'],
})
export class StorageModule {}
