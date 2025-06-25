import { HttpException, NotFoundException } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { AuthenticatedConnectionStoreGateway } from 'src/common/gateway/authenticated-connection-store.gateway';
import notification_gateway_events from './notification-gateway.constant';
import { NotificationService } from './services/notfication.service';

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

  // ***********************
  // Event methods (simplified using parent class methods)
  // ***********************

  emitUserGlobalNotification(
    notification: ReturnType<NotificationService['sanitizeNotification']>,
  ) {
    this.logger.log(`Emitting notification to all users`);
    this.server.emit(
      notification_gateway_events.emit_events.user_global,
      notification,
    );
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
    notification: ReturnType<NotificationService['sanitizeNotification']>,
  ) {
    this.emitToUsers(
      userIds,
      notification_gateway_events.emit_events.user_specific,
      notification,
    );
  }

  // ***********************
  // Event methods
  // ***********************

  emitNotificationToEveryone(
    notification: ReturnType<NotificationService['sanitizeNotification']>,
  ) {
    try {
      this.logger.log('Emitting notification to all users');
      // return all users
      const allUserSockets = this.server.sockets.sockets;

      if (allUserSockets.size === 0) {
        throw new NotFoundException('No users connected');
      }

      this.server.emit(
        notification_gateway_events.emit_events.user_global,
        notification,
      );

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
  emitCampusGlobalNotification(
    notification: ReturnType<NotificationService['sanitizeNotification']>,
  ) {
    return this.emitToGlobalCampusRoom(
      notification_gateway_events.emit_events.campus_global,
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
    notification: ReturnType<NotificationService['sanitizeNotification']>,
  ) {
    return this.emitToCampusSpecificRooms(
      notification_gateway_events.emit_events.campus_specific,
      campusIds,
      notification,
    );
  }
}
