import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
const sharp = require('sharp');

@Injectable()
export class AssetsService {
    private readonly uploadDir = path.join(process.cwd(), 'uploads');

    constructor() {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
    }

    // MVP: Handles local upload instead of real presigned S3 URLs to save time.
    // In production, this would return a Cloudinary or S3 presigned URL.
    async generatePresignedUrl(extension: string) {
        const filename = `${uuidv4()}.${extension}`;
        return {
            uploadUrl: `http://localhost:${process.env.PORT || 3000}/assets/upload-direct/${filename}`,
            fileKey: filename,
        };
    }

    async processAndSaveImage(fileBuffer: Buffer, filename: string): Promise<string> {
        const outputPath = path.join(this.uploadDir, `thumb_${filename}`);

        // Resize to 3:4 aspect ratio (e.g. 600x800) to avoid cluttered looks.
        await sharp(fileBuffer)
            .resize(600, 800, {
                fit: 'cover',
                position: 'center'
            })
            .toFile(outputPath);

        // Return the URL where the image is served statically
        return `http://localhost:${process.env.PORT || 3000}/static/thumb_${filename}`;
    }
}
