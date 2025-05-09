import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthStrategyEnum } from 'src/auth/strategies/strategy.enum';

@Injectable()
export class LocalAuthenticationGuard extends AuthGuard(
  AuthStrategyEnum.LoginStrategy,
) {} 