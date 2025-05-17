import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => ({
                success: true,
                data,
                message: null, // You can customize this or set dynamically
            })),
        );
    }
}


@Injectable()
export class ResponseInterceptorInTransition<T> implements NestInterceptor<T, any> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => ({
                success: true,
                data,
                message: null, // You can customize this or set dynamically
                ...(data || {}),
                note_for_developer: 'This api is under-going structure changes. The data in the root of the object will soon be removed and must be accessed from the "data" property.'
            })),
        );
    }
}

