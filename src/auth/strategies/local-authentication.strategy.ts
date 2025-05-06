import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { LoginDto } from 'src/auth/dto/login.dto';
import { AuthStrategyEnum } from 'src/auth/strategies/strategy.enum';
import { AuthService } from '../auth.service';

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
        email: string,
        password: string
    ) {
        const user = await this.authService.validateAndGetUserData_v1({ email, password });
        return user;
    }
} 