import { HttpException, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SocketStoreService } from 'src/common/services/socket-store.service';
import { IConfiguration } from 'src/config/configuration';
import { NotificationEvent } from './notification.types';
import { AuthService } from 'src/auth/auth.service';
import { AuthenticatedGateway } from 'src/common/gateway/authenticated.gateway';
import { AuthenticatedSocket } from 'src/auth/types/auth.interface';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
  namespace: 'notifications',
  transports: ['websocket', 'polling'],
})
export class NotificationGateway extends AuthenticatedGateway {
  private socketStoreService: SocketStoreService;

  constructor(protected readonly authService: AuthService) {
    super(authService);
  }

  // ***********************
  // Lifecycle methods
  // ***********************

  protected onAuthenticatedInit(server: Server): void {
    this.logger.log('NotificationGateway initialized');
  }

  // Custom logic for authenticated connections
  protected async onAuthenticatedConnection(authSocket: AuthenticatedSocket) {
    this.logger.log(
      `Authenticated client connected: ${authSocket.id}, user: ${authSocket.data.user.userId}`,
    );

    // TODO: Make this reusable as well (by optionally adding a decorator or extending another class)
    this.socketStoreService.addConnection({
      userId: authSocket.data.user._id,
      socketId: authSocket.id,
    });
  }

  // Custom logic for disconnects
  protected onAuthenticatedDisconnect(authSocket: AuthenticatedSocket) {
    this.logger.log(`Notification socket disconnected: ${authSocket.id}`);
    this.socketStoreService.removeAssociatedConnection({
      socketId: authSocket.id,
    });
  }

  // ***********************
  // Subscription methods
  // ***********************

  // subscribe to join
  @SubscribeMessage('join')
  handleJoin(client: Socket, payload: any) {
    this.logger.log(`Notification client joined: ${client.id}`);
    client.join(payload.userId); // TODO: REVIEW: Might not be needed for now. But can be used later if we want to send notifications to specific users i.e. admins, campus-admins, students, etc
  }

  // ***********************
  // Event methods
  // ***********************

  emitNotificationToUser(userId: string, notification: any) {
    this.logger.log(`Emitting notification to user: ${userId}`);
    this.server.to(`user_${userId}`).emit(NotificationEvent.USER, notification);
  }

  emitNotificationToAll(notification: any) {
    try {
      this.logger.log('Emitting notification to all users');
      // return all users
      const allUserSockets = this.server.sockets.sockets;

      if (allUserSockets.size === 0) {
        throw new NotFoundException('No users connected');
      }

      this.server.emit(NotificationEvent.GLOBAL, notification);
      this.server.serverSideEmit(NotificationEvent.GLOBAL, notification);
      return {
        success: true,
        message: 'Notification sent to all users',
        data: {
          // users: allUsers,
          allUserSockets,
        },
      };
    } catch (error) {
      this.logger.error('Error emitting notification to all users', error);

      if (error instanceof HttpException) {
        throw error;
      }

      return {
        success: false,
        message: 'Error emitting notification to all users',
      };
    }
  }
}
