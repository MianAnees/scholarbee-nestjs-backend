import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

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

  afterInit(server: Server) {
    this.logger.log('Notification WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Notification client connected: ${client.id}`);
    // Optionally, handle authentication here
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Notification client disconnected: ${client.id}`);
  }

  emitNotificationToUser(userId: string, notification: any) {
    this.logger.log(`Emitting notification to user: ${userId}`);
    this.server.to(`user_${userId}`).emit('notification', notification);
  }

  emitNotificationToAll(notification: any) {
    this.logger.log('Emitting notification to all users');
    this.server.emit('notification', notification);
  }
}
