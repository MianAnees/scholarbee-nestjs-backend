import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { HttpException, Logger, NotFoundException } from '@nestjs/common';
import { NotificationEvent } from './notification.types';
import { SocketStoreService } from 'src/common/services/socket-store.service';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
  namespace: 'notifications',
  transports: ['websocket', 'polling'],
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private socketStoreService: SocketStoreService; // REVIEW: should this be initialized here or in the constructor?

  // subscribe to join
  @SubscribeMessage('join')
  handleJoin(client: Socket, payload: any) {
    this.logger.log(`Notification client joined: ${client.id}`);
    client.join(payload.userId); // TODO: REVIEW: Might not be needed for now. But can be used later if we want to send notifications to specific users i.e. admins, campus-admins, students, etc
  }

  afterInit(server: Server) {
    this.logger.log('Notification WebSocket Gateway initialized');

    // initialize the socket store service
    this.socketStoreService = new SocketStoreService();
  }

  handleConnection(client: Socket) {
    this.logger.log(`Notification client connected: ${client.id}`);
    // Optionally, handle authentication here
    this.socketStoreService.addConnection({
      userId: client.data.user.id,
      socketId: client.id,
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Notification client disconnected: ${client.id}`);
    this.socketStoreService.removeAssociatedConnection({
      socketId: client.id,
    });
  }

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
