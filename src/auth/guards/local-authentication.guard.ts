import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthStrategyEnum } from 'src/auth/strategies/strategy.enum';

/**
 * Triggers the LocalAuthenticationStrategy before the request reaches the controller logic
 */
@Injectable()
export class LocalAuthenticationGuard extends AuthGuard(
  AuthStrategyEnum.LoginStrategy,
) {}
