import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { WardrobeService } from './wardrobe.service';
import { AiService } from '../ai/ai.service';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import { CreateItemDto, UpdateItemDto } from './dto/wardrobe.dto';

async function removeBackground(fileBuffer: Buffer): Promise<Buffer | null> {
    try {
        const { fal } = await import('@fal-ai/client');
        fal.config({ credentials: process.env.FAL_KEY });

        const base64 = fileBuffer.toString('base64');
        const dataUri = `data:image/jpeg;base64,${base64}`;

        const result: any = await fal.run('fal-ai/imageutils/rembg', {
            input: { image_url: dataUri }
        });

        const outputUrl: string = result?.image?.url || result?.data?.image?.url;
        if (!outputUrl) return null;

        // İndir
        const response = await fetch(outputUrl);
        const arrayBuffer = await response.arrayBuffer();
        const pngBuffer = Buffer.from(arrayBuffer);

        // Krem arka plan (#FDFBF7) üzerine kompozit
        const { width, height } = await sharp(pngBuffer).metadata();
        const w = width || 800;
        const h = height || 1067;

        // Krem zemin yarat ve üstüne şeffaf PNG'yi yapıştır
        const creamBg = await sharp({
            create: { width: w, height: h, channels: 3, background: { r: 253, g: 251, b: 247 } }
        })
            .png()
            .toBuffer();

        const composited = await sharp(creamBg)
            .composite([{ input: pngBuffer, blend: 'over' }])
            .jpeg({ quality: 92 })
            .toBuffer();

        return composited;
    } catch (err) {
        console.error('Background removal failed:', err);
        return null;
    }
}

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
        @Request() req: { user: { userId: string } },
        @Body() body: CreateItemDto,
        @UploadedFiles() files: Express.Multer.File[]
    ) {
        try {
            // Multi-select fix for form-data (strings might come as single or array)
            const colors = typeof body.colors === 'string' ? [body.colors] : (body.colors || []);
            const seasons = typeof body.seasons === 'string' ? [body.seasons] : (body.seasons || []);

            const photoUrls: string[] = [];

            if (files && files.length > 0) {
                for (const file of files) {
                    const originalPath = file.path;
                    const optimizedFilename = `opt_${file.filename}`;
                    const optimizedPath = path.join(file.destination, optimizedFilename);

                    let photoUrlToSave = `/static/${file.filename}`; // Fallback

                    try {
                        const originalBuffer = fs.readFileSync(originalPath);

                        // 1. Önce boyutlandır (800px wide)
                        const resizedBuffer = await sharp(originalBuffer)
                            .resize({ width: 800, withoutEnlargement: true })
                            .jpeg({ quality: 85 })
                            .toBuffer();

                        // 2. FAL ile arka plan kaldır (krem zemine koy)
                        const bgRemovedBuffer = await removeBackground(resizedBuffer);
                        const finalBuffer = bgRemovedBuffer || resizedBuffer;

                        fs.writeFileSync(optimizedPath, finalBuffer);
                        try { fs.unlinkSync(originalPath); } catch (e) { }
                        photoUrlToSave = `/static/${optimizedFilename}`;
                    } catch (sharpError) {
                        console.error('Image processing error:', sharpError);
                    }
                    photoUrls.push(photoUrlToSave);
                }
            } else if (body.imageUrl) {
                photoUrls.push(body.imageUrl);
            }

            return await this.wardrobeService.addItem(req.user.userId, {
                ...body,
                colors,
                seasons,
                photoUrls
            });
        } catch (globalErr) {
            console.error('Add Item Error:', globalErr);
            throw globalErr;
        }
    }

    @Delete('items/:id')
    async deleteItem(@Request() req: any, @Param('id') id: string) {
        return this.wardrobeService.deleteItem(req.user.userId, id);
    }

    @Post('items/:id')
    async updateItem(
        @Request() req: { user: { userId: string } },
        @Param('id') id: string,
        @Body() body: UpdateItemDto
    ) {
        const colors = typeof body.colors === 'string' ? [body.colors] : (body.colors || []);
        const seasons = typeof body.seasons === 'string' ? [body.seasons] : (body.seasons || []);

        return this.wardrobeService.updateItem(req.user.userId, id, {
            ...body,
            colors,
            seasons,
            gender: body.gender,
        });
    }
}
