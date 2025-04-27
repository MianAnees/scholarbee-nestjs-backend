import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RefreshAuthenticationStrategyEnum } from 'src/auth/strategies/strategy.enum';

@Injectable()
export class RefreshAuthenticationGuard extends AuthGuard(RefreshAuthenticationStrategyEnum.RefreshV2) { } 