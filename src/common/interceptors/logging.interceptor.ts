import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const { method, url, body, params, query } = req;
        const userAgent = req.get('user-agent') || '';
        const ip = req.ip;

        this.logger.debug(
            `[${method}] ${url} - IP: ${ip} - User-Agent: ${userAgent}`,
        );

        if (Object.keys(body).length > 0) {
            this.logger.debug(`Request Body: ${JSON.stringify(body)}`);
        }

        if (Object.keys(params).length > 0) {
            this.logger.debug(`Request Params: ${JSON.stringify(params)}`);
        }

        if (Object.keys(query).length > 0) {
            this.logger.debug(`Request Query: ${JSON.stringify(query)}`);
        }

        const now = Date.now();
        return next.handle().pipe(
            tap(data => {
                const response = context.switchToHttp().getResponse();
                const delay = Date.now() - now;

                this.logger.debug(
                    `[${method}] ${url} - ${response.statusCode} - ${delay}ms`,
                );

                if (data) {
                    // Truncate large responses to avoid flooding logs
                    const responseData = JSON.stringify(data).length > 1000
                        ? JSON.stringify(data).substring(0, 1000) + '... (truncated)'
                        : JSON.stringify(data);

                    this.logger.debug(`Response: ${responseData}`);
                }
            }),
        );
    }
} 