import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IConfiguration } from 'src/config/configuration';
import { ResourceProtectionStrategyEnum } from 'src/auth/strategies/strategy.enum';
import { LoginTokenPayload } from 'src/auth/auth.service';

@Injectable()
export class ResourceProtection extends PassportStrategy(Strategy, ResourceProtectionStrategyEnum.JwtV2) {
    constructor(private configService: ConfigService<IConfiguration>) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get('jwt.secret', { infer: true }),
        });
    }

    async validate(payload: LoginTokenPayload) {
        console.log(` payload:`, payload)
        // Customize the payload for v2 as needed
        return payload;
    }
} 