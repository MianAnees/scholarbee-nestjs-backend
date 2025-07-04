import { Request } from 'express';
import { Socket } from 'socket.io';
import { ResourceProtectionStrategy } from 'src/auth/strategies/resource-protection.strategy';
import { User } from 'src/users/schemas/user.schema';
import { BetterOmit } from 'src/utils/typescript.utils';
import { LocalAuthenticationStrategy } from '../strategies/local-authentication.strategy';

export type UserWithoutComparePassword = BetterOmit<User, 'comparePassword'> & {
  _id: string;
};
export type SanitizedUser = BetterOmit<
  UserWithoutComparePassword,
  'hash' | 'salt' | 'password'
>;

export type MinimalUserInfo = Pick<
  SanitizedUser,
  | 'first_name'
  | 'last_name'
  | 'email'
  | '_id'
  | 'user_type'
  | 'campus_id'
  | 'profile_image_url'
  | 'special_person'
  | 'current_stage'
  | 'nationality'
  | 'user_profile_id'
  | 'university_id'
  | 'phone_number'
>;

export interface AccessTokenPayload extends MinimalUserInfo {
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
