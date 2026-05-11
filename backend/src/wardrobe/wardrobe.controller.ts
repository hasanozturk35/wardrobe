import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { WardrobeService } from './wardrobe.service';
import { StorageProvider } from '../infrastructure/storage/storage.provider';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
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

        const response = await fetch(outputUrl);
        const arrayBuffer = await response.arrayBuffer();
        const pngBuffer = Buffer.from(arrayBuffer);

        const { width, height } = await sharp(pngBuffer).metadata();
        const w = width || 800;
        const h = height || 1067;

        const creamBg = await sharp({
            create: { width: w, height: h, channels: 3, background: { r: 253, g: 251, b: 247 } }
        }).png().toBuffer();

        return await sharp(creamBg)
            .composite([{ input: pngBuffer, blend: 'over' }])
            .jpeg({ quality: 92 })
            .toBuffer();
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
        private readonly aiService: AiService,
        private readonly storage: StorageProvider,
    ) { }

    @Get('items')
    async getItems(@Request() req: any) {
        return this.wardrobeService.getItems(req.user.userId);
    }

    @Post('items')
    @UseInterceptors(FilesInterceptor('photos', 5, { storage: memoryStorage() }))
    async addItem(
        @Request() req: { user: { userId: string } },
        @Body() body: CreateItemDto,
        @UploadedFiles() files: Express.Multer.File[]
    ) {
        const colors  = typeof body.colors  === 'string' ? [body.colors]  : (body.colors  || []);
        const seasons = typeof body.seasons === 'string' ? [body.seasons] : (body.seasons || []);

        const photoUrls: string[] = [];

        if (files && files.length > 0) {
            for (const file of files) {
                try {
                    // Boyutlandır
                    const resized = await sharp(file.buffer)
                        .resize({ width: 800, withoutEnlargement: true })
                        .jpeg({ quality: 85 })
                        .toBuffer();

                    // Arka plan kaldır (varsa)
                    const finalBuffer = (await removeBackground(resized)) || resized;

                    // Storage provider'a yükle (Cloudinary veya local)
                    const randomName = Array(16).fill(null)
                        .map(() => Math.round(Math.random() * 15).toString(16))
                        .join('');
                    const url = await this.storage.upload(
                        { buffer: finalBuffer, filename: `${randomName}.jpg`, mimetype: 'image/jpeg' },
                        `wardrobe/${randomName}.jpg`,
                    );
                    photoUrls.push(url);
                } catch (err) {
                    console.error('Image processing error:', err);
                }
            }
        } else if (body.imageUrl) {
            photoUrls.push(body.imageUrl);
        }

        return this.wardrobeService.addItem(req.user.userId, { ...body, colors, seasons, photoUrls });
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
        const colors  = typeof body.colors  === 'string' ? [body.colors]  : (body.colors  || []);
        const seasons = typeof body.seasons === 'string' ? [body.seasons] : (body.seasons || []);
        return this.wardrobeService.updateItem(req.user.userId, id, { ...body, colors, seasons, gender: body.gender });
    }
}
