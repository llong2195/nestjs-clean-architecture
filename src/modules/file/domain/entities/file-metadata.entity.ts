import { AggregateRoot } from '../../../../shared/domain-events/aggregate-root.base';

/**
 * FileMetadata domain entity
 * Represents metadata about an uploaded file
 */
export class FileMetadata extends AggregateRoot {
  constructor(
    public readonly id: string,
    private _originalName: string,
    private _mimeType: string,
    private _size: number,
    private _storageKey: string,
    private _url: string,
    private _uploadedBy: string,
    private _uploadedAt: Date,
  ) {
    super();
  }

  get originalName(): string {
    return this._originalName;
  }

  get mimeType(): string {
    return this._mimeType;
  }

  get size(): number {
    return this._size;
  }

  get storageKey(): string {
    return this._storageKey;
  }

  get url(): string {
    return this._url;
  }

  get uploadedBy(): string {
    return this._uploadedBy;
  }

  get uploadedAt(): Date {
    return this._uploadedAt;
  }

  static create(
    id: string,
    originalName: string,
    mimeType: string,
    size: number,
    storageKey: string,
    url: string,
    uploadedBy: string,
  ): FileMetadata {
    const file = new FileMetadata(
      id,
      originalName,
      mimeType,
      size,
      storageKey,
      url,
      uploadedBy,
      new Date(),
    );

    return file;
  }

  updateUrl(url: string): void {
    this._url = url;
  }
}
