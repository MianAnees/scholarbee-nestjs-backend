import { UseGuards } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Types } from 'mongoose';
import { Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt.guard';
import { AuthenticatedSocket } from 'src/auth/types/auth.interface';
import { AuthenticatedConnectionStoreGateway } from 'src/common/gateway/authenticated-connection-store.gateway';
import { Message } from './schemas/message.schema';
import chat_gateway_constants from './chat-gateway.constant';

type ActiveConversationStore = {
  userId: string;
  conversationId: string;
};

const activeConversationStore: Map<string, ActiveConversationStore> = new Map();

@WebSocketGateway({
  cors: {
    origin: '*', // For development - change to specific origins in production
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'chat',
  transports: ['websocket', 'polling'], // Allow both WebSocket and polling
})
@UseGuards(WsJwtGuard)
export class ChatGateway extends AuthenticatedConnectionStoreGateway {
  // @WebSocketServer()
  // server: Server;

  protected activeConversationStore: Map<string, string> = new Map();
  // Only inject the services needed for this gateway
  constructor(
    // private readonly chatService: ChatService,
    protected readonly authService: AuthService, // Do not redeclare as private/protected, just pass to super
  ) {
    super(authService);
  }

  private getUserActiveConversation(userId: string) {
    return this.activeConversationStore.get(userId) ?? null;
  }

  // TODO: Implement usage of this method
  private setUserActiveConversation(userId: string, conversationId: string) {
    this.activeConversationStore.set(userId, conversationId);
  }

  private removeUserActiveConversation(userId: string) {
    this.activeConversationStore.delete(userId);
  }

  // ***********************
  // Lifecycle methods
  // ***********************

  // Custom logic for authenticated connections
  protected async onAuthenticatedConnectionStoreConnection(
    authSocket: AuthenticatedSocket,
  ) {
    this.logger.log(
      `Authenticated client connected: ${authSocket.id}, user: ${authSocket.data.user.userId}`,
    );

    // Notify the client of successful connection
    authSocket.emit('connection_established', {
      message: 'Successfully connected to chat server',
      userId: authSocket.data.user._id,
    });
  }

  protected async onAuthenticatedConnectionStoreDisconnection(
    authSocket: AuthenticatedSocket,
  ) {
    this.logger.log(
      `Authenticated client disconnected: ${authSocket.id}, user: ${authSocket.data.user.userId}`,
    );

    // Remove the user's active conversation
    this.removeUserActiveConversation(authSocket.data.user._id);
  }

  private isActiveConversationOfUser(
    userId: string,
    conversationIdOfMessage: string,
  ) {
    const activeConversationIdOfUser = this.getUserActiveConversation(userId);
    if (!activeConversationIdOfUser) return false;

    return conversationIdOfMessage === activeConversationIdOfUser;
  }

  // ***********************
  // Subscription methods
  // ***********************

  // TODO: Method to join a conversation room
  /**
   * User can use this method to subscribe to a conversation
   * @param conversationId
   */
  @SubscribeMessage(
    chat_gateway_constants.subscription_events.join_conversation,
  )
  joinConversation(authSocket: AuthenticatedSocket, conversationId: string) {
    // // Get the user from the socket
    // const user = authSocket.data.user;

    // Emit to the conversation room
    const conversationRoom =
      chat_gateway_constants.rooms.conversation(conversationId);

    // Join the conversation room
    authSocket.join(conversationRoom);

    // Set the user's active conversation
    this.setUserActiveConversation(authSocket.data.user._id, conversationId);
  }

  // ***********************
  // Emit methods
  // ***********************

  /**
   * Emits a message notification ONLY to the
   * - users which are recipients of the conversation (excludes the sender)
   * - AND recipients is/are connected to the chat-socket
   * - AND recipients which do not have the conversation as the active conversation
   */
  emitMessageNotificationToOutOfFocusRecipients(
    conversationId: string,
    // TODO: Accept the exact notification payload or create-and-user a prepareMessageNotificaiton private method
    message: Message,
  ) {
    // ******************************
    // Get the recipients of the conversation by checking the users in the conversation room
    // ******************************

    let validRecipientsOfMessageNotification: string[] = [];

    // Prepare the conversation room constant
    const conversationRoom =
      chat_gateway_constants.rooms.conversation(conversationId);

    // Get the sockets in the conversation room
    const socketsConnectedToConversationRoom =
      this.server.sockets.adapter.rooms.get(conversationRoom);

    // Get the users against the sockets using the socket store service
    // There is a possibility that the room is empty
    socketsConnectedToConversationRoom.size > 0 &&
      socketsConnectedToConversationRoom.forEach((socketId) => {
        // For each socket in the conversation room, get the user
        const { userId: connUserId } = this.socketStoreService.getConnection({
          socketId,
        }); // will throw an error if the socket is not found; but this should not happen as each socket should have an associated user

        // Exclude the sender as he is not a recipient
        if (message.sender_id.toString() === connUserId) return;

        // Check if the active conversation of current connectedUser is the same as active conversation of the message
        const messageExistsInActiveConversationOfConnectedUser =
          this.isActiveConversationOfUser(connUserId, conversationId);

        // No need to send a message-notification to the user if the message is in the active conversation of the user
        if (messageExistsInActiveConversationOfConnectedUser) return;

        // Append the user to the valid recipients if the message notification
        validRecipientsOfMessageNotification.push(connUserId);
      });

    // ******************************
    // Send the message notification to the valid recipients
    // ******************************

    // Retrieve the event name
    const msgNotificationEvent =
      chat_gateway_constants.emit_events.message_notification;

    // Send the message notification to the valid recipients
    this.server
      .to(validRecipientsOfMessageNotification)
      .emit(msgNotificationEvent, {
        conversationId,
        messageId: message._id,
        senderId: message.sender_id,
        messageSnippet: message.content,
        timestamp: message.created_at,
      });
  }

  /**
   * Emits a message to the conversation room (includes all the participants of the conversation)
   * @param conversationId
   * @param data
   */
  emitMessageToConversation<T extends Record<string, any>>(
    conversationId: string,
    data: T,
  ) {
    // this.logger.log(`Emitting ${event} to conversation: ${conversationId}`);
    // console.log('Emitting event:', event, 'to conversation:', conversationId);

    // Emit to the conversation room
    const conversationRoom =
      chat_gateway_constants.rooms.conversation(conversationId);

    const conversationEvent =
      chat_gateway_constants.emit_events.conversation_message(conversationId);

    // Send the message only to the conversation room
    this.server.to(conversationRoom).emit(conversationEvent, data);
  }
}
