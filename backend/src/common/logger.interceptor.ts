import {
    CallHandler,
    ExecutionContext,
    Injectable,
    Logger,
    NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('HTTP');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const { method, url } = request;
        const userAgent = request.get('user-agent') || '';
        const ip = request.ip;
        const requestId = randomUUID();

        request.requestId = requestId;

        const now = Date.now();

        return next.handle().pipe(
            tap(() => {
                const response = context.switchToHttp().getResponse();
                const { statusCode } = response;
                const contentLength = response.get('content-length');

                this.logger.log(
                    `[${requestId}] ${method} ${url} ${statusCode} ${contentLength} - ${userAgent} ${ip} - ${Date.now() - now}ms`,
                );
            }),
        );
    }
}
