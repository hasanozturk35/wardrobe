import { Injectable, LoggerService } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class DbLoggerService implements LoggerService {
  constructor(private readonly prisma: PrismaService) {}

  async log(message: string, context?: string) {
    console.log(`[INFO] [${context}] ${message}`);
    await this.saveLog('info', message, context);
  }

  async error(message: string, trace?: string, context?: string) {
    console.error(`[ERROR] [${context}] ${message}`, trace);
    await this.saveLog('error', message, context);
  }

  async warn(message: string, context?: string) {
    console.warn(`[WARN] [${context}] ${message}`);
    await this.saveLog('warn', message, context);
  }

  private async saveLog(level: string, message: string, context?: string) {
    try {
      await this.prisma.systemLog.create({
        data: {
          level,
          message,
          context,
        },
      });
    } catch (e) {
      console.error('Failed to save log to DB:', e.message);
    }
  }
}
