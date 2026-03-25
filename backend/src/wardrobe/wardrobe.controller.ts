import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { WardrobeService } from './wardrobe.service';
import { AiService } from '../ai/ai.service';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';

@Controller('wardrobe')
@UseGuards(AuthGuard('jwt'))
export class WardrobeController {
    constructor(
        private readonly wardrobeService: WardrobeService,
        private readonly aiService: AiService
    ) { }

    @Get('items')
    async getItems(@Request() req: any) {
        return this.wardrobeService.getItems(req.user.userId);
    }

    @Post('items')
    @UseInterceptors(FilesInterceptor('photos', 5, {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${path.extname(file.originalname)}`);
            }
        })
    }))
    async addItem(
        @Request() req: any,
        @Body() body: { category: string, brand?: string, colors: string | string[], seasons: string | string[] },
        @UploadedFiles() files: Express.Multer.File[]
    ) {
        try {
            // Multi-select fix for form-data (strings might come as single or array)
            const colors = typeof body.colors === 'string' ? [body.colors] : body.colors;
            const seasons = typeof body.seasons === 'string' ? [body.seasons] : body.seasons;

            const photoUrls: string[] = [];

            if (files && files.length > 0) {
                for (const file of files) {
                    const originalPath = file.path;
                    const optimizedFilename = `opt_${file.filename}`;
                    const optimizedPath = path.join(file.destination, optimizedFilename);
                    const thumbFilename = `thumb_${file.filename}`;
                    const thumbPath = path.join(file.destination, thumbFilename);

                    let photoUrlToSave = `/static/${file.filename}`; // Fallback

                    try {
                        // Generate optimized image
                        await sharp(originalPath)
                            .resize({ width: 800, withoutEnlargement: true })
                            .jpeg({ quality: 80 })
                            .toFile(optimizedPath);

                        // Generate thumbnail
                        await sharp(originalPath)
                            .resize(400, 400, { fit: 'cover', position: 'center' })
                            .jpeg({ quality: 70 })
                            .toFile(thumbPath);

                        // Delete original to save space
                        try { fs.unlinkSync(originalPath); } catch (e) { }

                        photoUrlToSave = `/static/${optimizedFilename}`;
                    } catch (sharpError) {
                        console.error('Sharp processing error, falling back to original image:', sharpError);
                        // Do not delete originalPath, we will serve it directly as fallback
                    }

                    // Save image URL to db
                    photoUrls.push(photoUrlToSave);
                }
            }

            const newItem = await this.wardrobeService.addItem(req.user.userId, {
                ...body,
                colors: colors || [],
                seasons: seasons || [],
                photoUrls
            });

            // Start 3D Generation in background if we have a photo
            if (photoUrls.length > 0) {
                // Determine absolute URL for Tripo (PoC assuming public tunnel or direct access)
                const fullUrl = `${req.protocol}://${req.get('host')}${photoUrls[0]}`;
                this.aiService.generate3DModel(newItem.id, fullUrl).catch((e: any) => console.error('BG Mesh Gen Error', e));
            }

            return newItem;
        } catch (globalErr) {
            try { fs.writeFileSync('upload_error.log', globalErr.stack || globalErr.toString()); } catch (e) { }
            throw globalErr;
        }
    }

    @Delete('items/:id')
    async deleteItem(@Request() req: any, @Param('id') id: string) {
        return this.wardrobeService.deleteItem(req.user.userId, id);
    }

    @Post('items/:id') // Using POST for update if multipart/form-data is used, or PATCH for JSON
    async updateItem(
        @Request() req: any,
        @Param('id') id: string,
        @Body() body: { category?: string, brand?: string, colors?: string | string[], seasons?: string | string[] }
    ) {
        const colors = typeof body.colors === 'string' ? [body.colors] : body.colors;
        const seasons = typeof body.seasons === 'string' ? [body.seasons] : body.seasons;

        return this.wardrobeService.updateItem(req.user.userId, id, {
            ...body,
            colors,
            seasons
        });
    }
}
