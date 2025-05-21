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
import { UserNS } from 'src/users/schemas/user.schema';

const notificationRooms = {
  campus_global: 'campus/global',
  campus_specific: (campusId: string) => `campus/${campusId}`,
};

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
    // Join a room with `campus/{campus_id}` and `campus/global`, if the user is a campus admin
    if (authSocket.data.user.user_type === UserNS.UserType.Campus_Admin) {
      // Join the `campus/{campus_id}` room
      authSocket.join(
        notificationRooms.campus_specific(authSocket.data.user.campus_id),
      );

      // Join the `campus/global` room
      authSocket.join(notificationRooms.campus_global);
    }
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

  emitUserSpecificNotification(
    userId: string,
    notification: Record<string, any>,
  ) {
    this.emitToUser(
      userId,
      NotificationNamespace.Event.USER_SPECIFIC,
      notification,
    );
  }

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
    this.logger.log(`Emitting campus global notification to all users`);
    // For now, emit to all sockets; clients should filter by campusId
    // Emit to Room: campus/global at the Event: CAMPUS_GLOBAL
    this.server
      .to(notificationRooms.campus_global) // the event is sent to specific event to prevent leaking notifications to users who are don't belong to the campus
      .emit(NotificationNamespace.Event.CAMPUS_GLOBAL, notification);
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
    this.logger.log(
      `Emitting specific campuses notification to campuses: ${campusIds.join(',')}`,
    );

    // TODO: Do not emit any notifications against any campus if the room doesn't exist or is empty. (Rooms must be a part of the socket store service just like users)
    // Get the rooms for the campuses
    const rooms = campusIds.map((id) => notificationRooms.campus_specific(id));

    // Emit to Room: campus/{campusId} at the Event: CAMPUS_SPECIFIC
    this.server
      .to(rooms)
      .emit(NotificationNamespace.Event.CAMPUS_SPECIFIC, notification);
  }
}