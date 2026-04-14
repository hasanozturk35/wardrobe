import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body } = request;
    const startTime = Date.now();

    // Sensitive operations list (can be expanded)
    const isSensitive = method !== 'GET' || url.includes('admin') || url.includes('auth');

    return next.handle().pipe(
      tap(async () => {
        if (isSensitive && user) {
          const duration = Date.now() - startTime;
          
          try {
            // We'll use the SystemLog table for now but with a specific context
            // In a larger system, we'd have a separate AuditLog table
            await this.prisma.systemLog.create({
              data: {
                level: 'audit',
                message: `${user.email} performed ${method} on ${url}`,
                context: 'AUDIT_TRAIL',
                userId: user.userId || user.sub,
              },
            });
          } catch (error) {
            this.logger.error(`Failed to record audit log: ${error.message}`);
          }
        }
      }),
    );
  }
}
