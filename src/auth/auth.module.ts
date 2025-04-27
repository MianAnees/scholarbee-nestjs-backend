import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { IConfiguration } from 'src/config/configuration';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthV1Guard } from './guards/auth-v1.guard';
import { LocalAuthenticationGuard } from './guards/local-authentication.guard';
import { ResourceProtectionGuard } from './guards/resource-protection.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalAuthenticationStrategy } from './strategies/local-authentication.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { ResourceProtectionStrategy } from './strategies/resource-protection.strategy';
import { RefreshAuthenticationStrategyEnum } from 'src/auth/strategies/strategy.enum';
import { RefreshAuthenticationStrategy } from 'src/auth/strategies/refresh-authentication.strategy';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.registerAsync({
            inject: [ConfigService],
            useFactory: (configService: ConfigService<IConfiguration>) => ({
                secret: configService.get('jwt.loginSecret', { infer: true }),
                signOptions: {
                    expiresIn:
                        `${configService.get('jwt.loginExpiration', { infer: true })}s`
                }, // Access token expires in 15 minutes
            }),
        })
    ],
    providers: [
        AuthService,
        JwtStrategy,
        LocalStrategy,
        AuthV1Guard,

        ResourceProtectionStrategy,
        LocalAuthenticationStrategy,
        RefreshAuthenticationStrategy,

        LocalAuthenticationGuard,
        ResourceProtectionGuard
    ],
    controllers: [AuthController],
    exports: [AuthService, AuthV1Guard],
})
export class AuthModule { } 