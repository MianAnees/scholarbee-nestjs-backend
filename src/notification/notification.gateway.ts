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
import { AuthenticatedGateway } from 'src/common/gateway/authenticated.gateway';
import { SocketStoreService } from 'src/common/services/socket-store.service';
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

    // initialize the socket store service
    this.socketStoreService = new SocketStoreService();
  }

  // Custom logic for authenticated connections
  protected async onAuthenticatedConnection(authSocket: AuthenticatedSocket) {
    try {
      this.logger.log(
        `Authenticated client connected: ${authSocket.id}, user: ${authSocket.data.user.userId}`,
      );

      // TODO: Make this reusable as well, like auth gateway logic (by optionally adding a decorator or extending another class)
      this.socketStoreService.addConnection({
        userId: authSocket.data.user._id,
        socketId: authSocket.id,
      });

      // Join a room with `campus/{campus_id}` and `campus/global`, if the user is a campus admin
      // TODO: REVIEW: Why is the 'Campus_Admin' having the type of 'Admin'
      if (authSocket.data.user.user_type === UserNS.UserType.Campus_Admin) {
        // Join the `campus/{campus_id}` room
        authSocket.join(
          notificationRooms.campus_specific(authSocket.data.user.campus_id),
        );

        // Join the `campus/global` room
        authSocket.join(notificationRooms.campus_global);
      }
    } catch (error) {
      if (this.socketStoreService === undefined) {
        this.logger.error('Socket store service not initialized');
      }
      throw error;
    }
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

  // // Server-side event handler
  // @SubscribeMessage(ServerEventListeners.JOIN)
  // handleJoin(client: Socket, payload: any) {
  //   this.logger.log(`Notification client joined: ${client.id}`);
  //   client.join(payload.userId); // TODO: REVIEW: Might not be needed for now. But can be used later if we want to send notifications to specific users i.e. admins, campus-admins, students, etc
  // }

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
      this.server.serverSideEmit(
        NotificationNamespace.Event.USER_GLOBAL,
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

  emitUserGlobalNotification(notification: Record<string, any>) {
    this.logger.log(`Emitting notification to all users`);
    // emit notification to `user/global` event on all sockets
    this.server.emit(NotificationNamespace.Event.USER_GLOBAL, notification);
  }

  emitUserSpecificNotification(
    userId: string,
    notification: Record<string, any>,
  ) {
    try {
      this.logger.log(`Emitting notification to user: ${userId}`);
      // retrieve the socket id of the user from the socket store service
      const { socketId } = this.socketStoreService.getConnection({ userId });
      // emit notification to the user's socket
      this.server
        .to(socketId)
        .emit(NotificationNamespace.Event.USER_SPECIFIC, notification);
    } catch (error) {
      this.logger.error(
        `Error emitting notification to user: ${userId}`,
        error,
      );
    }
  }

  /**
   * Emit a notification to multiple users
   * Checks
   * @param userIds - The list of user ids to emit the notification to
   * @param notification - The notification to emit
   */
  emitMultipleUserSpecificNotifications(
    userIds: string[],
    notification: Record<string, any>,
  ) {
    // Finds the active connections for the target users (filter out the inactive ones)
    const activeConnections =
      this.socketStoreService.getAllConnections(userIds);

    // Retrieve the socket ids of the active connections
    const activeSockets = activeConnections.map(({ socketId }) => socketId);
    // Emit the notification to the active sockets
    if (activeSockets.length > 0) {
      this.server
        .to(activeSockets)
        .emit(NotificationNamespace.Event.USER_SPECIFIC, notification);
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