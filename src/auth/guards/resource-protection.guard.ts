import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ResourceProtectionStrategyEnum } from 'src/auth/strategies/strategy.enum';

@Injectable()
export class ResourceProtectionGuard extends AuthGuard(ResourceProtectionStrategyEnum.JwtV2) {
    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        console.log(` err, user, info:`, { err, user, info })
        if (err || !user) {
            throw err || new UnauthorizedException('Authentication required');
        }
        return user;
    }
} 