import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenExpiredError, JsonWebTokenError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { AuthStrategyEnum } from 'src/auth/strategies/strategy.enum';
import { AUTH_ERROR_CODE } from '../enums/error-code.enum';

/**
 * This guard is used to protect resources that are only accessible to authenticated users.
 * This prevents the controller from being called if the user is not authenticated. (Auth Token is not found or expired)
 */
@Injectable()
export class ResourceProtectionGuard extends AuthGuard(
  AuthStrategyEnum.ResourceProtectionStrategy,
) {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err, user, info, context) {
    // check if the user is authenticated
    if (err || !user) {
      console.log(` ResourceProtectionGuard: handleRequest:`, {
        err,
        user,
        info,
        context,
      });

      // check if the token is not found
      if (info.message === 'No auth token') {
        throw new UnauthorizedException(
          AUTH_ERROR_CODE.TOKEN_NOT_FOUND,
          'Token not found in the request',
        );
      } else if (info instanceof JsonWebTokenError) {
        // check if info is an instance of Error
        if (info instanceof TokenExpiredError) {
          throw new UnauthorizedException(
            AUTH_ERROR_CODE.TOKEN_EXPIRED,
            'Token expired',
          );
        } else if (info.message.includes('malformed')) {
          throw new UnauthorizedException(
            AUTH_ERROR_CODE.TOKEN_MALFORMED,
            'Token malformed',
          );
        } else if (info.message.includes('invalid signature')) {
          throw new UnauthorizedException(
            AUTH_ERROR_CODE.TOKEN_INVALID_SIGNATURE,
            'Invalid signature; Ensure that correct token is used',
          );
        }
      }

      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
