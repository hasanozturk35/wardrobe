import { Injectable, BadRequestException } from '@nestjs/common';
import { StorageProvider } from '../infrastructure/storage/storage.provider';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
const sharp = require('sharp');

@Injectable()
export class AssetsService {
  private readonly baseUrl: string;

  constructor(
    private readonly storage: StorageProvider,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('BASE_URL') || `http://localhost:${this.configService.get('PORT') || 3000}`;
  }

  async generatePresignedUrl(extension: string) {
    const filename = `${uuidv4()}.${extension}`;
    return {
      uploadUrl: `${this.baseUrl}/assets/upload-direct/${filename}`,
      fileKey: filename,
    };
  }

  async processAndSaveImage(fileBuffer: Buffer, filename: string): Promise<string> {
    // Resize to 3:4 aspect ratio (e.g. 600x800) to avoid cluttered looks.
    const processedBuffer = await sharp(fileBuffer)
      .resize(600, 800, {
        fit: 'cover',
        position: 'center'
      })
      .toBuffer();

    const path = `thumb_${filename}`;
    const uploadedPath = await this.storage.upload({
      buffer: processedBuffer,
      filename: path,
      mimetype: 'image/jpeg',
    }, path);

    return `${this.baseUrl}${this.storage.getUrl(uploadedPath)}`;
  }

  validateFile(file: Express.Multer.File) {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }

    if (file.size > maxSizeBytes) {
      throw new BadRequestException('File is too large. Max size is 5MB.');
    }
  }
}
