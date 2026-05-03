import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

const redisEnabled = Boolean(
  process.env.REDIS_URL || process.env.REDIS_HOST || process.env.REDIS_PORT
);

const bullImports = redisEnabled
  ? [
      BullModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          connection: {
            host: configService.get<string>('REDIS_HOST') || 'localhost',
            port: configService.get<number>('REDIS_PORT') || 6379,
          },
        }),
      }),
      // Register specific queues
      BullModule.registerQueue(
        { name: 'ai-tasks' },
        { name: 'avatar-tasks' },
        { name: 'asset-processing' }
      ),
    ]
  : [];

const bullExports = redisEnabled ? [BullModule] : [];

if (!redisEnabled) {
  // eslint-disable-next-line no-console
  console.warn('Redis not configured; skipping BullMQ setup. Background jobs disabled.');
}

@Global()
@Module({
  imports: bullImports,
  exports: bullExports,
})
export class QueueModule {}
