import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthStrategyEnum } from 'src/auth/strategies/strategy.enum';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalAuthenticationStrategy extends PassportStrategy(
  Strategy,
  AuthStrategyEnum.LoginStrategy,
) {
  constructor(private authService: AuthService) {
    super({
      // These fields will be auto-extracted from the request body and spread-passed to the validate method i.e. {email, password} will be passed as separate arguments to the validate method
      usernameField: 'email', // default: 'username'
      passwordField: 'password', // default: 'password'
    });
  }

  /**
   * This method verifies the user's credentials and returns the user object.
   * The actual payload for tokens is generated and signed in the `auth.service.login` method.
   * @param email 
   * @param password 
   * @returns 
   */
  async validate(email: string, password: string) {
    const user = await this.authService.validateUser({
      email,
      password,
    });

    return user;
  }
} 