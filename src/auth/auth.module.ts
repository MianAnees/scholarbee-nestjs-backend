import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { AuthV1Guard } from './guards/auth-v1.guard';
import { ResourceProtection } from './strategies/resource-protection.strategy';
import { LocalAuthenticationStrategy } from './strategies/local-authentication.strategy';
import { LocalAuthenticationGuard } from './guards/local-authentication.guard';
import { ResourceProtectionGuard } from './guards/resource-protection.guard';
import { IConfiguration } from 'src/config/configuration';

@Module({
    imports: [
        UsersModule,
        PassportModule,
        JwtModule.registerAsync({
            // imports: [ConfigModule], // Review: Is this import necessary, as it's already imported in the AppModule as global?
            inject: [ConfigService],
            useFactory: (configService: ConfigService<IConfiguration>) => ({
                secret: configService.get('jwt.secret', { infer: true }),
                signOptions: { expiresIn: '60s' },
            }),
        }),
    ],
    providers: [AuthService, JwtStrategy, LocalStrategy, AuthV1Guard, ResourceProtection, LocalAuthenticationStrategy, LocalAuthenticationGuard, ResourceProtectionGuard],
    controllers: [AuthController],
    exports: [AuthService, AuthV1Guard],
})
export class AuthModule { } 