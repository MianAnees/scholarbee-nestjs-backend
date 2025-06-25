import { Injectable, Logger } from '@nestjs/common';

interface Connection {
  userId: string;
  socketId: string;
}

export class SocketStoreService {
  private readonly logger = new Logger(SocketStoreService.name);
  private readonly connectionsUserToSocket = new Map<string, string>();
  private readonly connectionsSocketToUser = new Map<string, string>();

  /**
   * Accepts a connection object
   * Removes the connection from the store
   * @param connection
   * @returns true if the connection was removed, false otherwise
   */
  private removeConnection(connection: Connection) {
    this.connectionsUserToSocket.delete(connection.userId);
    this.connectionsSocketToUser.delete(connection.socketId);

    return true;
  }

  /**
   * Accepts a connection object
   * Adds the connection to the store
   * @param connection
   */
  addConnection(connection: Connection) {
    this.connectionsUserToSocket.set(connection.userId, connection.socketId);
    this.connectionsSocketToUser.set(connection.socketId, connection.userId);
  }

  /**
   * Accepts either userId or socketId
   * Returns the connection object
   * @param userId
   * @param socketId
   * @returns Connection
   */
  getConnection({ userId, socketId }: Partial<Connection>): Connection | null {
    try {
      let connection: Connection | null = null;

      if (userId) {
        const socketId = this.connectionsUserToSocket.get(userId);
        if (!socketId)
          throw new Error('No socketId found for the provided userId');

        connection = { userId, socketId };
      }

      if (socketId) {
        const userId = this.connectionsSocketToUser.get(socketId);
        if (!userId)
          throw new Error('No userId found for the provided socketId');

        connection = { userId, socketId };
      }

      if (!connection) throw new Error('No userId or socketId provided');

      return connection;
    } catch (error) {
      // this.logger.error('Error in getConnection', error);
      return null;
    }
  }

  /**
   * Returns connections filtered by userIds
   * If no userIds are provided, returns all active connections
   * @param filterUserIds - The list of userIds to filter the connections by
   * @returns Map<string, string>
   */
  getAllConnections(filterUserIds?: string[]) {
    // return connections as an array of objects
    const connections: Connection[] = [];

    const connectionEntries = filterUserIds
      ? // if filterUserIds are provided, only return the active connections for the provided userIds
        Array.from(this.connectionsUserToSocket.entries()).filter(
          ([connUserId]) => filterUserIds.includes(connUserId),
        )
      : this.connectionsUserToSocket.entries();

    for (const [userId, socketId] of connectionEntries) {
      connections.push({ userId, socketId });
    }

    return connections;
  }

  /**
   * Removes all connections
   */
  removeAllConnections() {
    this.connectionsUserToSocket.clear();
    this.connectionsSocketToUser.clear();
  }

  /**
   * Accepts either userId or socketId associated with a connection
   * Remove the connection from the store i.e. from both maps
   * @param userId
   * @param socketId
   */
  removeAssociatedConnection({
    userId,
    socketId,
  }: {
    userId?: string;
    socketId?: string;
  }) {
    try {
      let connection: Connection | null = null;

      // if userId is provided, first retrieve the associated socketId and then remove the connection from both maps
      if (userId) {
        connection = this.getConnection({ userId });
      }

      // if socketId is provided, first retrieve the associated userId and then remove the connection from both maps
      if (socketId) {
        connection = this.getConnection({ socketId });
      }

      if (!connection) throw new Error('No userId or socketId provided');

      return this.removeConnection(connection);
    } catch (error) {
      this.logger.error('Error in removeAssociatedConnection', error);
      return null;
    }
  }
}
