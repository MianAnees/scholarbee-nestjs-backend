import { Logger, UnauthorizedException } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { AuthenticatedSocket } from 'src/auth/types/auth.interface';

export abstract class AuthGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  protected readonly logger = new Logger(this.constructor.name);

  constructor(protected readonly authService: AuthService) {}

  // This is called by NestJS on every new connection
  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    try {
      const queryToken = client.handshake.query.token;
      const headerToken = client.handshake.headers.authorization?.split(' ')[1];
      const token = queryToken || headerToken;

      if (!token) throw new UnauthorizedException('No token provided');

      const user = await this.authService.verifyAuthToken(token);
      client.data.user = user;

      await this.onAuthenticatedConnection(client, ...args);
    } catch (err) {
      // this.logger.warn(
      //   `Disconnecting client: ${client.id} due to auth failure`,
      // );
      client.disconnect();
    }
  }

  // This is called by NestJS on every disconnect
  handleDisconnect(client: AuthenticatedSocket) {
    this.onAuthenticatedDisconnect(client);
  }

  // Hooks for child classes to override
  protected abstract onAuthenticatedConnection(
    client: AuthenticatedSocket,
    ...args: any[]
  ): Promise<void> | void;
  protected abstract onAuthenticatedDisconnect(
    client: AuthenticatedSocket,
  ): void;
}
