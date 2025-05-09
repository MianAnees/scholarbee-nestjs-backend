import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { AuthenticatedRequest } from '../types/auth.interface';

export const AuthReq = createParamDecorator<undefined, ExecutionContext, AuthenticatedRequest>(
    (_data, ctx) => {
        const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
        if (!request.user) {
            throw new BadRequestException('User object not found in request');
        }
        return request;
    }
); 