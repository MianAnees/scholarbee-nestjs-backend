// src/common/gateway/store-managing.gateway.ts
import { Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { AuthenticatedSocket } from 'src/auth/types/auth.interface';
import { SocketStoreService } from 'src/common/services/socket-store.service';
import { UserNS } from 'src/users/schemas/user.schema';
import { AuthenticatedGateway } from './authenticated.gateway';

const userRooms = {
  user_global: 'user/global',
  user_specific: (userId: string) => `user/${userId}`,
  campus_global: 'campus/global',
  campus_specific: (campusId: string) => `campus/${campusId}`,
};

export abstract class AuthenticatedConnectionStoreGateway extends AuthenticatedGateway {
  protected socketStoreService: SocketStoreService;

  constructor(protected readonly authService: AuthService) {
    super(authService);
    this.socketStoreService = new SocketStoreService();
  }

  // ***********************
  // User & Campus Room management methods
  // ***********************

  private joinCampusRoomsIfCampusAdmin(authSocket: AuthenticatedSocket) {
    if (authSocket.data.user.user_type === UserNS.UserType.Campus_Admin) {
      // Join the `campus/global` room
      authSocket.join(userRooms.campus_global);

      // Join the `campus/{campus_id}` room
      authSocket.join(
        userRooms.campus_specific(authSocket.data.user.campus_id),
      );
    }
  }

  private joinUserRooms(authSocket: AuthenticatedSocket) {
    // Join the `user/global` room
    authSocket.join(userRooms.user_global);
    // Join the `user/{user_id}` room
    authSocket.join(userRooms.user_specific(authSocket.data.user._id));
  }

  // Helper methods for child classes
  // protected emitToUser<T extends Record<string, unknown>>(
  //   userId: string,
  //   event: string,
  //   data: T,
  // ): void {
  //   try {
  //     // retrieve the socket id of the user from the socket store service
  //     const { socketId } = this.socketStoreService.getConnection({ userId });

  //     // emit notification to the user's socket
  //     this.server.to(socketId).emit(event, data);
  //   } catch (error) {
  //     this.logger.error(`Error emitting to user ${userId}`, error);
  //   }
  // }

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

  protected emitToGlobalUserRoom<T extends Record<string, any>>(
    event: string,
    data: T,
  ) {
    this.logger.log(`Emitting notification to global user rooms`);
    const globalUserRoom = userRooms.user_global;

    return this.server.to(globalUserRoom).emit(event, data);
  }

  protected emitToSpecificUserRooms<T extends Record<string, any>>(
    userIds: string[],
    event: string,
    data: T,
  ) {
    this.logger.log(
      `Emitting notification to specific user rooms: ${userIds.join(',')}`,
    );

    // Prepare the room-ids for the users
    const specificUserRooms = userIds.map((id) => userRooms.user_specific(id));

    return this.server.to(specificUserRooms).emit(event, data);
  }

  protected emitToGlobalCampusRoom<T extends Record<string, any>>(
    event: string,
    data: T,
  ) {
    this.logger.log(`Emitting notification to global campus rooms`);
    const globalCampusRoom = userRooms.campus_global;

    return this.server.to(globalCampusRoom).emit(event, data);
  }

  protected emitToCampusSpecificRooms<T extends Record<string, any>>(
    event: string,
    campusIds: string[],
    data: T,
  ) {
    this.logger.log(
      `Emitting specific campuses notification to campuses: ${campusIds.join(',')}`,
    );

    // Get the rooms for the campuses
    const specificCampusRooms = campusIds.map((id) =>
      userRooms.campus_specific(id),
    );

    // Emit to Room: campus/{campusId} at the Event: CAMPUS_SPECIFIC
    return this.server.to(specificCampusRooms).emit(event, data);
  }

  // TODO: Make the lifecycle methods optionalal for child classes that don't need them

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

      // Join the user rooms
      // ? Rooms are required for multi-device notifications
      this.joinUserRooms(authSocket);

      // Join the campus rooms if the user is a campus admin
      this.joinCampusRoomsIfCampusAdmin(authSocket);

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
  protected onAuthenticatedConnectionStoreInit(server: Server): void {}
  protected onAuthenticatedConnectionStoreConnection(
    client: AuthenticatedSocket,
    ...args: any[]
  ): Promise<void> | void {}
  protected onAuthenticatedConnectionStoreDisconnect(
    client: AuthenticatedSocket,
  ): void {}
}
