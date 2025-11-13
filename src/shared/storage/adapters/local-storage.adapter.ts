import { Injectable, Logger } from '@nestjs/common';
import { AppConfigService } from '../../config/config.service';
import { IStorageAdapter } from '../interfaces/storage-adapter.interface';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * LocalStorageAdapter - File system storage implementation
 * Stores files in local file system directory
 */
@Injectable()
export class LocalStorageAdapter implements IStorageAdapter {
  private readonly logger = new Logger(LocalStorageAdapter.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: AppConfigService) {
    this.uploadDir = this.configService.uploadDir;
    this.baseUrl = this.configService.baseUrl;
    void this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      this.logger.log(`Upload directory ensured: ${this.uploadDir}`);
    } catch (error) {
      this.logger.error(`Failed to create upload directory: `, error);
    }
  }

  async upload(file: Buffer, key: string, metadata?: Record<string, string>): Promise<string> {
    const filePath = path.join(this.uploadDir, key);
    const fileDir = path.dirname(filePath);

    // Ensure directory exists
    await fs.mkdir(fileDir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, file);

    // Store metadata if provided
    if (metadata) {
      await fs.writeFile(`${filePath}.meta.json`, JSON.stringify(metadata, null, 2));
    }

    this.logger.log(`File uploaded: ${key}`);
    return this.getUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, key);
    const buffer = await fs.readFile(filePath);
    this.logger.log(`File downloaded: ${key}`);
    return buffer;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);

    try {
      await fs.unlink(filePath);
      // Also delete metadata if exists
      try {
        await fs.unlink(`${filePath}.meta.json`);
      } catch {
        // Metadata file might not exist
      }
      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${key}:`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getUrl(key: string, _expiresIn?: number): Promise<string> {
    // Local storage doesn't support expiring URLs
    return await Promise.resolve(`${this.baseUrl}/files/${key}`);
  }
}
