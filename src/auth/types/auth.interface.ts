import { Request } from 'express';
import { SanitizedUser } from '../auth.service'; // adjust path as needed
import { ResourceProtectionStrategy } from 'src/auth/strategies/resource-protection.strategy';

export interface AccessTokenPayload extends SanitizedUser {
    sub: string;
    userId: string;
}

export interface RefreshTokenPayload {
    userId: string;
    sub: string;
}

export interface AuthenticatedRequest extends Request {
    user: Awaited<ReturnType<ResourceProtectionStrategy['validate']>>;
}