import { Controller, Post, UseInterceptors, UploadedFile, Param, Get, BadRequestException, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { AssetsService } from './assets.service';

@Controller('assets')
@UseGuards(AuthGuard('jwt'))
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) { }

  @Get('presigned-url')
  async getPresignedUrl() {
    return this.assetsService.generatePresignedUrl('jpg');
  }

  @Post('upload-direct/:filename')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDirect(
    @Param('filename') filename: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('File not provided');

    // Security: Validate the filename to prevent path traversal
    // In a real production-grade app, we'd ignore the client-provided filename 
    // or validate it against a strictly defined pattern (e.g. UUID).
    if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
        throw new BadRequestException('Invalid filename pattern');
    }

    // Enterprise-grade validation inside the service
    this.assetsService.validateFile(file);

    // Process and save using abstract storage (non-blocking)
    const thumbUrl = await this.assetsService.processAndSaveImage(file.buffer, filename);
    
    return { success: true, url: thumbUrl };
  }
}
