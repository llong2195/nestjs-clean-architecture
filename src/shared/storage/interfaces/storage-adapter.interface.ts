/**
 * Storage adapter interface for file operations
 * Supports both local file system and cloud storage (S3)
 */
export interface IStorageAdapter {
  /**
   * Upload a file to storage
   * @param file - File buffer
   * @param key - Storage key/path
   * @param metadata - Optional metadata
   * @returns Storage URL
   */
  upload(file: Buffer, key: string, metadata?: Record<string, string>): Promise<string>;

  /**
   * Download a file from storage
   * @param key - Storage key/path
   * @returns File buffer
   */
  download(key: string): Promise<Buffer>;

  /**
   * Delete a file from storage
   * @param key - Storage key/path
   */
  delete(key: string): Promise<void>;

  /**
   * Check if file exists
   * @param key - Storage key/path
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get file URL
   * @param key - Storage key/path
   * @param expiresIn - Optional expiration time in seconds (for signed URLs)
   */
  getUrl(key: string, expiresIn?: number): Promise<string>;
}
