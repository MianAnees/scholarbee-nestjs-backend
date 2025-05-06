import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, RefreshTokenPayload } from 'src/auth/auth.service';
import { RefreshAuthenticationStrategyEnum } from 'src/auth/strategies/strategy.enum';
import { IConfiguration } from 'src/config/configuration';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class RefreshAuthenticationStrategy extends PassportStrategy(Strategy, RefreshAuthenticationStrategyEnum.RefreshV2) {
    constructor(
        private configService: ConfigService<IConfiguration>,
        private authService: AuthService,
        private usersService: UsersService
    ) {

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get('jwt.refreshSecret', { infer: true }),
            ignoreExpiration: false,
            passReqToCallback: true,
        });
    }

    async validate(req: Request, payload: RefreshTokenPayload) {

        const refreshToken = req.headers.authorization.replace('Bearer ', '');
        if (!refreshToken) {
            throw new UnauthorizedException('No refresh token provided');
        }

        // Verify the refresh token
        return this.authService.validateRefreshToken(payload.userId, refreshToken);
    }

} 