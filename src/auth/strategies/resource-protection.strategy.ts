import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IConfiguration } from 'src/config/configuration';
import { ResourceProtectionStrategyEnum } from 'src/auth/strategies/strategy.enum';
import { AccessTokenPayload } from 'src/auth/auth.service';

@Injectable()
export class ResourceProtectionStrategy extends PassportStrategy(Strategy, ResourceProtectionStrategyEnum.JwtV2) {
    constructor(private configService: ConfigService<IConfiguration>) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('jwt.loginSecret', { infer: true }),
        });

    }

    // TODO: How to handle the error (to show the expiry error to user)
    async validate(payload: AccessTokenPayload) {
        // Customize the payload for v2 as needed
        return payload;
    }
} 