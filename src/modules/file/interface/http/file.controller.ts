import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator';
import type { IStorageAdapter } from '../../../../shared/storage/interfaces/storage-adapter.interface';
import { JwtAuthGuard } from '../../../auth/interface/guards/jwt-auth.guard';
import { FileUploadResponseDto } from '../../application/dtos/file-upload-response.dto';
import { UploadFileUseCase } from '../../application/use-cases/upload-file.use-case';

@ApiTags('files')
@Controller('files')
export class FileController {
  constructor(
    private readonly uploadFileUseCase: UploadFileUseCase,
    @Inject('STORAGE_ADAPTER')
    private readonly storageAdapter: IStorageAdapter,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: FileUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - no file provided' })
  @ApiResponse({ status: 413, description: 'File too large' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('sub') userId: string,
  ): Promise<FileUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // File type validation (common types)
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    const result = await this.uploadFileUseCase.execute(file, userId);

    return {
      id: result.id,
      originalName: result.originalName,
      mimeType: result.mimeType,
      size: result.size,
      storageKey: result.storageKey,
      url: result.url,
      uploadedAt: result.uploadedAt,
    };
  }

  @Get(':key')
  @ApiOperation({ summary: 'Download a file' })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(@Param('key') key: string, @Res() res: Response): Promise<void> {
    try {
      const buffer = await this.storageAdapter.download(key);
      res.send(buffer);
    } catch (_error) {
      res.status(HttpStatus.NOT_FOUND).send({ message: 'File not found' });
    }
  }
}
