import {
    Controller,
    Post,
    Get,
    Body,
    Request,
    UseGuards,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AvatarService } from './avatar.service';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';

@Controller('avatar')
@UseGuards(JwtAuthGuard)
export class AvatarController {
    constructor(private readonly avatarService: AvatarService) { }

    @Get('status')
    async getMyAvatar(@Request() req: any) {
        const userId = req.user.userId || req.user.sub || req.user.id;
        return this.avatarService.getAvatar(userId);
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
        const userId = req.user.userId || req.user.sub || req.user.id;
        const fileUrl = `/static/avatars/${file.filename}`;
        return this.avatarService.uploadAvatar(userId, fileUrl, file.originalname);
    }

    @Post('upload-selfie')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/avatars',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `selfie-${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
        }),
    )
    async uploadSelfie(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
        const url = `/static/avatars/${file.filename}`;
        const userId = req.user.userId || req.user.sub || req.user.id;
        return this.avatarService.updateSelfie(userId, url);
    }

    @Post('upload-body')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/avatars',
                filename: (req, file, cb) => {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                    cb(null, `body-${uniqueSuffix}${extname(file.originalname)}`);
                },
            }),
        }),
    )
    async uploadBody(@Request() req: any, @UploadedFile() file: Express.Multer.File) {
        const url = `/static/avatars/${file.filename}`;
        const userId = req.user.userId || req.user.sub || req.user.id;
        return this.avatarService.updateBodyPhoto(userId, url);
    }

    @Post('trigger-synthesis')
    async triggerSynthesis(@Request() req: any) {
        const userId = req.user.userId || req.user.sub || req.user.id;
        return this.avatarService.triggerSynthesis(userId);
    }

    @Post('set-url')
    async setAvatarUrl(@Request() req: any, @Body() body: { url: string }) {
        if (!body?.url) throw new BadRequestException('url is required');
        const userId = req.user.userId || req.user.sub || req.user.id;
        return this.avatarService.setAvatarUrl(userId, body.url);
    }
}
