import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthStrategyEnum } from 'src/auth/strategies/strategy.enum';
import { AccessTokenPayload } from 'src/auth/types/auth.interface';
import { IConfiguration } from 'src/config/configuration';

@Injectable()
export class ResourceProtectionStrategy extends PassportStrategy(
  Strategy,
  AuthStrategyEnum.ResourceProtectionStrategy,
) {
  constructor(private configService: ConfigService<IConfiguration>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.loginSecret', { infer: true }),
    });
  }

  async validate(payload: AccessTokenPayload) {
    return payload;
  }
}