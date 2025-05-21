// src/common/gateway/store-managing.gateway.ts
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { AuthenticatedSocket } from 'src/auth/types/auth.interface';
import { SocketStoreService } from 'src/common/services/socket-store.service';
import { AuthenticatedGateway } from './authenticated.gateway';

export abstract class AuthenticatedConnectionStoreGateway extends AuthenticatedGateway {
  protected socketStoreService: SocketStoreService;

  constructor(protected readonly authService: AuthService) {
    super(authService);
    this.socketStoreService = new SocketStoreService();
  }

  // Override onAuthenticatedInit from AuthenticatedGateway
  protected onAuthenticatedInit(server: Server): void {
    this.logger.log(`${this.constructor.name} initialized with socket store`);
    // Allow child classes to perform additional initialization
    this.onAuthenticatedConnectionStoreInit(server);
  }

  // Override onAuthenticatedConnection from AuthenticatedGateway
  protected async onAuthenticatedConnection(
    authSocket: AuthenticatedSocket,
    ...args: any[]
  ): Promise<void> {
    try {
      this.logger.log(
        `Authenticated client connected: ${authSocket.id}, user: ${authSocket.data.user._id}`,
      );

      // Add connection to the socket store
      this.socketStoreService.addConnection({
        userId: authSocket.data.user._id,
        socketId: authSocket.id,
      });

      // Allow child classes to perform additional connection logic
      await this.onAuthenticatedConnectionStoreConnection(authSocket, ...args);
    } catch (error) {
      this.logger.error(
        'Error in authenticated connection store gateway connection',
        error,
      );
      throw error;
    }
  }

  // Override onAuthenticatedDisconnect from AuthenticatedGateway
  protected onAuthenticatedDisconnect(authSocket: AuthenticatedSocket): void {
    this.logger.log(`Socket disconnected: ${authSocket.id}`);

    // Remove connection from socket store
    this.socketStoreService.removeAssociatedConnection({
      socketId: authSocket.id,
    });

    // Allow child classes to perform additional disconnect logic
    this.onAuthenticatedConnectionStoreDisconnect(authSocket);
  }

  // Abstract methods for child classes to implement
  protected abstract onAuthenticatedConnectionStoreInit(server: Server): void;
  protected abstract onAuthenticatedConnectionStoreConnection(
    client: AuthenticatedSocket,
    ...args: any[]
  ): Promise<void> | void;
  protected abstract onAuthenticatedConnectionStoreDisconnect(
    client: AuthenticatedSocket,
  ): void;

  // Helper methods for child classes
  protected emitToUser<T extends Record<string, unknown>>(
    userId: string,
    event: string,
    data: T,
  ): void {
    try {
      // retrieve the socket id of the user from the socket store service
      const { socketId } = this.socketStoreService.getConnection({ userId });

      // emit notification to the user's socket
      this.server.to(socketId).emit(event, data);
    } catch (error) {
      this.logger.error(`Error emitting to user ${userId}`, error);
    }
  }

  protected emitToUsers<T extends Record<string, unknown>>(
    userIds: string[],
    event: string,
    data: T,
  ): void {
    // Finds the active connections for the target users (filter out the inactive ones)
    const activeConnections =
      this.socketStoreService.getAllConnections(userIds);

    // Retrieve the socket ids of the active connections
    const activeSockets = activeConnections.map(({ socketId }) => socketId);

    // Emit the notification to the active sockets
    if (activeSockets.length > 0) {
      this.server.to(activeSockets).emit(event, data);
    }
  }
}
