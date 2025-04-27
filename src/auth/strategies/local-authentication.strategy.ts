import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { LoginDto } from 'src/auth/dto/login.dto';
import { AuthStrategyEnum } from 'src/auth/strategies/strategy.enum';

// TODO: How to use this to enforce type in constructor?
type LoginDtoType = keyof LoginDto;

@Injectable()
export class LocalAuthenticationStrategy extends PassportStrategy(Strategy, AuthStrategyEnum.LocalV2) {
    constructor(private authService: AuthService) {
        super({
            // These fields will be auto-extracted from the request body and spread-passed to the validate method i.e. {email, password} will be passed as separate arguments to the validate method
            usernameField: 'email', // default: 'username'
            passwordField: 'password', // default: 'password'
        });
    }

    async validate(
        // these parameters will be extracted from the request body
        email: string,
        password: string
    ) {
        const user = await this.authService.validateAndGetUserData_v1({ email, password });
        console.log(` user:`, user)
        return user;
    }
} 