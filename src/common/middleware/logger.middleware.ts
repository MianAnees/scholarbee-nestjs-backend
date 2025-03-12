import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction) {
        const { ip, method, originalUrl } = req;
        const userAgent = req.get('user-agent') || '';
        const startTime = Date.now();

        // Log the request
        this.logger.log(
            `REQUEST: ${method} ${originalUrl} - ${ip} - ${userAgent}`
        );

        if (Object.keys(req.body).length > 0) {
            this.logger.debug(`Request Body: ${JSON.stringify(req.body)}`);
        }

        // Capture original end function
        const originalEnd = res.end;

        // Override end function
        res.end = function (chunk?: any, encoding?: any, callback?: any): any {
            // Calculate response time
            const responseTime = Date.now() - startTime;

            // Get response data
            const { statusCode } = res;
            const contentLength = res.get('content-length') || 0;

            // Log the response
            Logger.log(
                `RESPONSE: ${method} ${originalUrl} ${statusCode} ${contentLength} - ${responseTime}ms`,
                'HTTP'
            );

            // Call original end function
            return originalEnd.call(this, chunk, encoding, callback);
        };

        next();
    }
} 