import { ApiProperty } from '@nestjs/swagger';

export class FileUploadResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ example: 'document.pdf' })
  originalName!: string;

  @ApiProperty({ example: 'application/pdf' })
  mimeType!: string;

  @ApiProperty({ example: 1024000 })
  size!: number;

  @ApiProperty({ example: 'files/2024/11/123e4567-e89b-12d3-a456-426614174000.pdf' })
  storageKey!: string;

  @ApiProperty({
    example: 'http://localhost:3000/files/2024/11/123e4567-e89b-12d3-a456-426614174000.pdf',
  })
  url!: string;

  @ApiProperty({ example: '2024-11-13T10:00:00Z' })
  uploadedAt!: Date;
}
