import {
  Controller, Get, Patch, Post, Param, Body, UseGuards, Req,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const avatarStorage = diskStorage({
  destination: (_req, _file, cb) => {
    const dir = './uploads/avatars';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const rand = Array(24).fill(null).map(() => Math.round(Math.random() * 15).toString(16)).join('');
    cb(null, `${rand}${path.extname(file.originalname)}`);
  },
});

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Req() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) return null;
    const { passwordHash, resetToken, resetTokenExpires, ...safe } = user as any;
    return safe;
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    return this.usersService.getStats(req.user.userId);
  }

  @Patch('profile')
  async updateProfile(@Req() req: any, @Body() body: { name?: string }) {
    return this.usersService.updateProfile(req.user.userId, { name: body.name });
  }

  @Get(':id/public')
  async getPublicProfile(@Req() req: any, @Param('id') targetId: string) {
    return this.usersService.getPublicProfile(req.user.userId, targetId);
  }

  @Post(':id/follow')
  async toggleFollow(@Req() req: any, @Param('id') targetId: string) {
    return this.usersService.toggleFollow(req.user.userId, targetId);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar', { storage: avatarStorage }))
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    const optimizedFilename = `opt_${file.filename.replace(/\.[^.]+$/, '.jpg')}`;
    const optimizedPath = path.join(file.destination, optimizedFilename);

    try {
      await sharp(file.path)
        .resize({ width: 400, height: 400, fit: 'cover' })
        .jpeg({ quality: 85 })
        .toFile(optimizedPath);
      fs.unlinkSync(file.path);
    } catch {
      // keep original if sharp fails
      fs.renameSync(file.path, optimizedPath);
    }

    const avatarUrl = `/static/avatars/${optimizedFilename}`;
    return this.usersService.updateProfile(req.user.userId, { avatarUrl });
  }
}
