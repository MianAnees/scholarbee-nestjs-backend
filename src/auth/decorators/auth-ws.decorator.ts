import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { AuthenticatedSocket } from '../types/auth.interface';

export const AuthWebSocket = createParamDecorator<
  undefined,
  ExecutionContext,
  AuthenticatedSocket
>((_data, ctx) => {
  const authSocket = ctx.switchToWs().getClient<AuthenticatedSocket>();
  if (!authSocket.data.user) {
    throw new BadRequestException(
      'User object not found in request. Please ensure that the route is protected by the ResourceProtectionGuard.',
    );
  }
  return authSocket /* .data.user */;
});
