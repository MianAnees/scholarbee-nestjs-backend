import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import {
  AuthenticatedRequest,
  LoginRequest,
} from 'src/auth/types/auth.interface';

export const LoginReq = createParamDecorator<
  undefined,
  ExecutionContext,
  LoginRequest
>((_data, ctx) => {
  const request = ctx.switchToHttp().getRequest<LoginRequest>();
  if (!request.user) {
    throw new BadRequestException(
      'User object not found in request. Please ensure that the route is protected by the ResourceProtectionGuard.',
    );
  }
  return request;
}); 


export const AuthReq = createParamDecorator<undefined, ExecutionContext, AuthenticatedRequest>(
    (_data, ctx) => {
        const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
        if (!request.user) {
            throw new BadRequestException('User object not found in request. Please ensure that the route is protected by the ResourceProtectionGuard.');
        }
        return request;
    }
); 