import { HttpException, Logger, UnauthorizedException } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { AuthenticatedSocket } from 'src/auth/types/auth.interface';

/**
 * Client should be listening to these events from the server
 */
enum ClientEventListener {
  ERROR = 'error',
}


export abstract class AuthenticatedGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  protected readonly logger = new Logger(this.constructor.name);

  // Note: In the base AuthGateway, authService and logger are marked as protected so that child classes can access them if needed (e.g., for logging or advanced authentication logic). If you want to restrict access to only the base class, use private. However, protected is more flexible for extensible base classes.
  constructor(protected readonly authService: AuthService) {}

  // This is called by NestJS on every new connection
  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    try {
      const queryToken = client.handshake.query.token;
      const headerToken = client.handshake.headers.authorization?.split(' ')[1];
      const token = queryToken || headerToken;

      if (!token) throw new UnauthorizedException('No token provided');

      const user = await this.authService.verifyAuthToken(token).catch((err) => {
        throw new UnauthorizedException(err.message);
      });
      client.data.user = user;

      await this.onAuthenticatedConnection(client, ...args);
    } catch (err) {
      this.logger.warn(
        `Disconnecting client: ${client.id} due to auth failure`,
      );
      if (err instanceof UnauthorizedException) {
        client.emit(ClientEventListener.ERROR, err.getResponse());
      } else {
        client.emit(ClientEventListener.ERROR, err);
      }
      client.disconnect();
    }
  }

  // This is called by NestJS on every disconnect
  handleDisconnect(client: AuthenticatedSocket) {
    this.onAuthenticatedDisconnect(client);
  }

  afterInit(server: Server) {
    this.logger.log('Authenticated WebSocket Gateway initialized');
    this.onAuthenticatedInit(server);
  }

  // TODO: Explain this i.e. `protected abstract`
  // TODO: Explain why not simply have callback functions instead
  // Hooks for child classes to override
  protected abstract onAuthenticatedConnection(
    client: AuthenticatedSocket,
    ...args: any[]
  ): Promise<void> | void;

  protected abstract onAuthenticatedDisconnect(
    client: AuthenticatedSocket,
  ): void;

  protected abstract onAuthenticatedInit(server: Server): void;
}
