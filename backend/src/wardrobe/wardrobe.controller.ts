import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { WardrobeService } from './wardrobe.service';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('wardrobe')
@UseGuards(AuthGuard('jwt'))
export class WardrobeController {
    constructor(private readonly wardrobeService: WardrobeService) { }

    @Get('items')
    async getItems(@Request() req: any) {
        return this.wardrobeService.getItems(req.user.userId);
    }

    @Post('items')
    @UseInterceptors(FileInterceptor('photo', {
        storage: diskStorage({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
                return cb(null, `${randomName}${extname(file.originalname)}`);
            }
        })
    }))
    async addItem(
        @Request() req: any,
        @Body() body: { category: string, brand?: string, colors: string | string[], seasons: string | string[] },
        @UploadedFile() file: Express.Multer.File
    ) {
        // Multi-select fix for form-data (strings might come as single or array)
        const colors = typeof body.colors === 'string' ? [body.colors] : body.colors;
        const seasons = typeof body.seasons === 'string' ? [body.seasons] : body.seasons;

        return this.wardrobeService.addItem(req.user.userId, {
            ...body,
            colors,
            seasons,
            photoUrl: file ? `/static/${file.filename}` : undefined
        });
    }

    @Delete('items/:id')
    async deleteItem(@Request() req: any, @Param('id') id: string) {
        return this.wardrobeService.deleteItem(req.user.userId, id);
    }
}
