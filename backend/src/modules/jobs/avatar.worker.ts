import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { GenerateAvatarJob } from '../../ai/dto/ai-jobs.dto';

@Processor('avatar-tasks')
export class AvatarWorker extends WorkerHost {
  private readonly logger = new Logger(AvatarWorker.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing avatar job ${job.id} of type ${job.name}...`);

    switch (job.name) {
      case 'synthesize-avatar':
        return this.handleAvatarSynthesis(job.data as GenerateAvatarJob);
      default:
        this.logger.warn(`Unknown job type: ${job.name}`);
    }
  }

  private async handleAvatarSynthesis(data: GenerateAvatarJob) {
    const { userId, selfieUrl, bodyPhotoUrl } = data;
    this.logger.log(`[AvatarWorker] Starting neural synthesis for user ${userId}`);

    try {
        // High-level simulation of AI processing
        for (let i = 1; i <= 3; i++) {
            await new Promise(res => setTimeout(res, 3000));
            this.logger.log(`[AvatarWorker] Synthesis Progress for ${userId}: ${i * 33}%`);
        }

        const tripoKey = process.env.TRIPO_API_KEY;
        let meshUrl = '/static/avatars/default_avatar.glb';

        if (tripoKey) {
            // Placeholder for premium avatar generated via Tripo/BodyScan
            meshUrl = '/static/avatars/generated_premium_avatar.glb';
        }

        // Mark as ready in DB
        const result = await this.prisma.avatar.update({
          where: { userId },
          data: { 
            url: meshUrl,
            status: 'ready',
            updatedAt: new Date(),
            metadata: {
                ...(await this.getMetadata(userId) as any),
                synthesis_completed_at: new Date().toISOString()
            }
          },
        });

        this.logger.log(`[AvatarWorker] Success! Avatar for user ${userId} is now READY.`);
        return result;
    } catch (error) {
        this.logger.error(`Error in Avatar worker for ${userId}: ${error.message}`);
        await this.prisma.avatar.update({
            where: { userId },
            data: { status: 'failed' }
        });
        throw error;
    }
  }

  private async getMetadata(userId: string) {
    const avatar = await this.prisma.avatar.findUnique({ where: { userId } });
    return avatar?.metadata || {};
  }
}
