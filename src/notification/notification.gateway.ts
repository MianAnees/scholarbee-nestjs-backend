import {
  HttpException,
  NotFoundException
} from '@nestjs/common';
import {
  WebSocketGateway
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { AuthenticatedSocket } from 'src/auth/types/auth.interface';
import { AuthenticatedConnectionStoreGateway } from 'src/common/gateway/authenticated-connection-store.gateway';
import { NotificationNamespace } from './notification.types';

@WebSocketGateway({
  cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
  namespace: 'notifications',
  transports: ['websocket', 'polling'],
})
export class NotificationGateway extends AuthenticatedConnectionStoreGateway {
  constructor(protected readonly authService: AuthService) {
    super(authService);
  }

  // ***********************
  // Override store-managing methods
  // ***********************

  protected onAuthenticatedConnectionStoreInit(server: Server): void {
    this.logger.log('NotificationGateway initialized');
  }

  protected async onAuthenticatedConnectionStoreConnection(
    authSocket: AuthenticatedSocket,
  ) {
    // Any notification-specific connection logic
  }

  protected onAuthenticatedConnectionStoreDisconnect(
    authSocket: AuthenticatedSocket,
  ): void {
    // Any notification-specific disconnect logic
  }

  // ***********************
  // Event methods (simplified using parent class methods)
  // ***********************

  emitUserGlobalNotification(notification: Record<string, any>) {
    this.logger.log(`Emitting notification to all users`);
    this.server.emit(NotificationNamespace.Event.USER_GLOBAL, notification);
  }

  // emitUserSpecificNotification(
  //   userId: string,
  //   notification: Record<string, any>,
  // ) {
  //   this.emitToUser(
  //     userId,
  //     NotificationNamespace.Event.USER_SPECIFIC,
  //     notification,
  //   );
  // }

  emitMultipleUserSpecificNotifications(
    userIds: string[],
    notification: Record<string, any>,
  ) {
    this.emitToUsers(
      userIds,
      NotificationNamespace.Event.USER_SPECIFIC,
      notification,
    );
  }

  // ***********************
  // Event methods
  // ***********************

  emitNotificationToEveryone(notification: any) {
    try {
      this.logger.log('Emitting notification to all users');
      // return all users
      const allUserSockets = this.server.sockets.sockets;

      if (allUserSockets.size === 0) {
        throw new NotFoundException('No users connected');
      }

      this.server.emit(NotificationNamespace.Event.USER_GLOBAL, notification);

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

  /**
   * Emit a global notification to all users in a campus
   * @param campusId - The campus ID
   * @param notification - The notification payload
   */
  emitCampusGlobalNotification(notification: Record<string, any>) {
    return this.emitToGlobalCampusRoom(
      NotificationNamespace.Event.CAMPUS_GLOBAL,
      notification,
    );
  }

  /**
   * Emit a notification to all users for multiple campuses
   * @param campusIds - The campus IDs
   * @param notification - The notification payload
   */
  emitMultipleCampusSpecificNotification(
    campusIds: string[],
    notification: Record<string, any>,
  ) {
    return this.emitToCampusSpecificRooms(
      NotificationNamespace.Event.CAMPUS_SPECIFIC,
      campusIds,
      notification,
    );
  }
}