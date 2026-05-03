import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';

const redisEnabled = Boolean(
    process.env.REDIS_URL || process.env.REDIS_HOST || process.env.REDIS_PORT
);

@Module({
    imports: [
        PrismaModule,
        ...(redisEnabled ? [
            BullModule.registerQueue(
                { name: 'ai-tasks' },
                { name: 'avatar-tasks' }
            )
        ] : []),
    ],
    controllers: [AiController],
    providers: [AiService],
    exports: [AiService],
})
export class AiModule { }
