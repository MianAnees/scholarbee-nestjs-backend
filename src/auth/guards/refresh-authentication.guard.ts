import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { AuthStrategyEnum } from 'src/auth/strategies/strategy.enum';

@Injectable()
export class RefreshAuthenticationGuard extends AuthGuard(
  AuthStrategyEnum.RefreshStrategy,
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
        throw new UnauthorizedException('Token not found');
      } else if (info instanceof JsonWebTokenError) {
        // check if info is an instance of Error
        if (info instanceof TokenExpiredError) {
          throw new UnauthorizedException('Token expired');
        } else if (info.message.includes('malformed')) {
          throw new UnauthorizedException('Token malformed');
        } else if (info.message.includes('invalid signature')) {
          throw new UnauthorizedException(
            'Invalid signature; Ensure that correct token is used',
          );
        }
      }

      throw err || new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
