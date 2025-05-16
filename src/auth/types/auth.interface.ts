import { Request } from 'express';
import { SanitizedUser } from '../auth.service'; // adjust path as needed
import { ResourceProtectionStrategy } from 'src/auth/strategies/resource-protection.strategy';
import { LocalAuthenticationStrategy } from '../strategies/local-authentication.strategy';
import { Socket } from 'socket.io';

export interface AccessTokenPayload extends SanitizedUser {
  sub: string;
  userId: string;
}

export interface RefreshTokenPayload {
  userId: string;
  sub: string;
}

export interface LoginRequest extends Request {
  user: Awaited<ReturnType<LocalAuthenticationStrategy['validate']>>;
}

export interface AuthenticatedRequest extends Request {
  user: Awaited<ReturnType<ResourceProtectionStrategy['validate']>>;
}

export interface AuthenticatedSocket extends Socket {
  data: {
    // user: AccessTokenPayload;
    user: Awaited<ReturnType<ResourceProtectionStrategy['validate']>>;
  };
}