import { Module } from '@nestjs/common';
import { AiWorker } from './ai.worker';
import { AvatarWorker } from './avatar.worker';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';

const redisEnabled = Boolean(
  process.env.REDIS_URL || process.env.REDIS_HOST || process.env.REDIS_PORT
);

const providers = redisEnabled ? [AiWorker, AvatarWorker] : [];

@Module({
  imports: [PrismaModule],
  providers,
})
export class JobsModule {}
