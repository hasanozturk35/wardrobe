import { Controller, Post, UseInterceptors, UploadedFile, Param, Get, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AssetsService } from './assets.service';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('assets')
export class AssetsController {
    constructor(private readonly assetsService: AssetsService) { }

    @Get('presigned-url')
    async getPresignedUrl() {
        // In MVP, we mock the S3 presigned URL mechanism.
        return this.assetsService.generatePresignedUrl('jpg');
    }

    @Post('upload-direct/:filename')
    @UseInterceptors(FileInterceptor('file'))
    async uploadDirect(
        @Param('filename') filename: string,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) throw new Error('File not provided');

        // Save locally to mimic successful upload
        const uploadPath = path.join(process.cwd(), 'uploads', filename);
        fs.writeFileSync(uploadPath, file.buffer);

        // Process and generate thumbnail
        const thumbUrl = await this.assetsService.processAndSaveImage(file.buffer, filename);
        return { success: true, url: thumbUrl };
    }
}
