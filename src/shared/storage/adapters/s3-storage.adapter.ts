import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/config.service';
import { IStorageAdapter } from '../interfaces/storage-adapter.interface';

/**
 * S3StorageAdapter - AWS S3 storage implementation
 * Stores files in AWS S3 bucket
 */
@Injectable()
export class S3StorageAdapter implements IStorageAdapter {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(private readonly configService: AppConfigService) {
    this.bucket = this.configService.awsS3Bucket || '';

    if (!this.bucket) {
      throw new Error('AWS_S3_BUCKET is required for S3 storage');
    }

    this.s3Client = new S3Client({
      region: this.configService.awsRegion || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.awsAccessKeyId || '',
        secretAccessKey: this.configService.awsSecretAccessKey || '',
      },
    });

    this.logger.log(`S3 storage initialized with bucket: ${this.bucket}`);
  }

  async upload(file: Buffer, key: string, metadata?: Record<string, string>): Promise<string> {
    try {
      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: file,
          Metadata: metadata,
        },
      });

      await upload.done();
      this.logger.log(`File uploaded to S3: ${key}`);
      return this.getUrl(key);
    } catch (error) {
      this.logger.error(`Failed to upload file to S3:`, error);
      throw error;
    }
  }

  async download(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const chunks: Uint8Array[] = [];

      if (response.Body) {
        for await (const chunk of response.Body as any) {
          chunks.push(chunk);
        }
      }

      const buffer = Buffer.concat(chunks);
      this.logger.log(`File downloaded from S3: ${key}`);
      return buffer;
    } catch (error) {
      this.logger.error(`Failed to download file from S3: `, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`File deleted from S3: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file from S3: `, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  async getUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      this.logger.error(`Failed to generate signed URL: `, error);
      throw error;
    }
  }
}
