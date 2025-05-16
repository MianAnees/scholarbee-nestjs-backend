import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import {
  AuthenticatedRequest,
  LoginRequest,
} from 'src/auth/types/auth.interface';


/**
 * This decorator is used to get the user object from the request.
 * This assumes that the route is protected by the LocalAuthenticationGuard.
 * Therefore, the user object is always expected to be present in the request. Otherwise, it will throw a BadRequestException. (Which should never happen for routes protected by the LocalAuthenticationGuard)
 */
export const LoginReq = createParamDecorator<
  undefined,
  ExecutionContext,
  LoginRequest
>((_data, ctx) => {
  const loginRequest = ctx.switchToHttp().getRequest<LoginRequest>();
  if (!loginRequest.user) {
    throw new BadRequestException(
      'User object not found in request. Please ensure that the route is protected by the ResourceProtectionGuard.',
    );
  }
  return loginRequest;
}); 


/**
 * This decorator is used to get the user object from the request.
 * This assumes that the route is protected by the ResourceProtectionGuard.
 * Therefore, the user object is always expected to be present in the request. Otherwise, it will throw a BadRequestException. (Which should never happen for routes protected by the ResourceProtectionGuard)
 */
export const AuthReq = createParamDecorator<undefined, ExecutionContext, AuthenticatedRequest>(
    (_data, ctx) => {
        const authRequest = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
        if (!authRequest.user) {
            throw new BadRequestException('User object not found in request. Please ensure that the route is protected by the ResourceProtectionGuard.');
        }
        return authRequest;
    }
); 


// TODO: RefreshReq