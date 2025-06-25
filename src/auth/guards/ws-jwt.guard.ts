import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { AuthService } from '../auth.service';
import { AccessTokenPayload } from '../types/auth.interface';

/**
 * This guard is used to authenticate a WebSocket connection using a JWT token.
 * It is only triggered for message handlers i.e. methods annotated with @SubscribeMessage() and not for the connection event handlers i.e. OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, handleConnection, handleDisconnect, handleInit, etc.
 */
@Injectable()
export class WsJwtGuard implements CanActivate {
  private readonly logger = new Logger('WsJwtGuard');

  constructor(private readonly authService: AuthService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const client: Socket = ctx.switchToWs().getClient();
    this.logger.debug(`Checking JWT for client ${client.id}`);

    // Get token from query first, then from Bearer header
    const queryToken = client.handshake.query.token;
    const headerToken = client.handshake.headers.authorization?.split(' ')[1];
    const token = queryToken || headerToken;

    try {
      const payload = await this.authService.verifyAuthToken(token);
      this.logger.debug(`Token verified for user ${payload.sub}`);

      // Attach user to client for future use
      client.data.user = payload;
      return true;
    } catch (error) {
      this.logger.error(`Invalid token: ${error.message}`);
      throw new WsException('Invalid token');
    }
  }
}
