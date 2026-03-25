import { Controller, Post, Get, Request, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AvatarService } from './avatar.service';

@Controller('avatar')
@UseGuards(AuthGuard('jwt'))
export class AvatarController {
    constructor(private readonly avatarService: AvatarService) { }

    @Get()
    async getMyAvatar(@Request() req: any) {
        return this.avatarService.getAvatar(req.user.userId);
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('glb', {
        storage: diskStorage({
            destination: './uploads/avatars',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                return cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
            }
        }),
        fileFilter: (req, file, cb) => {
            if (extname(file.originalname).toLowerCase() !== '.glb') {
                return cb(new BadRequestException('Only .glb files are allowed!'), false);
            }
            cb(null, true);
        },
        limits: {
            fileSize: 15 * 1024 * 1024 // 15 MB
        }
    }))
    async uploadAvatar(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
        if (!file) throw new BadRequestException('File is missing or invalid');

        const fileUrl = `/static/avatars/${file.filename}`;
        return this.avatarService.uploadAvatar(req.user.userId, fileUrl, file.originalname);
    }
}
