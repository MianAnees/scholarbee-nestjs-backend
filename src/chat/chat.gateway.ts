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
    return this.activeConversationStore.delete(userId);
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
    // TODO: Add validation to check if the requested conversationId is associated with the user

    // Emit to the conversation room
    const conversationRoom =
      chat_gateway_constants.rooms.conversation(conversationId);

    // Join the conversation room
    authSocket.join(conversationRoom);
    this.logger.log(
      `User (${authSocket.data.user._id}) joined conversation room (${conversationRoom})`,
    );

    // Set the user's active conversation
    this.setUserActiveConversation(authSocket.data.user._id, conversationId);
    this.logger.log(
      `Conversation (${conversationId}) set as active for user (${authSocket.data.user._id})`,
    );
  }

  // leave conversation
  @SubscribeMessage(
    chat_gateway_constants.subscription_events.leave_conversation,
  )
  leaveConversation(authSocket: AuthenticatedSocket) {

    // Remove the user's active conversation
    this.removeUserActiveConversation(authSocket.data.user._id);
    this.logger.log(
      `User (${authSocket.data.user._id}) removed as active for conversation`,
    );
    console.log('🚀 ~ ChatGateway ~ leaveConversation ~ authSocket:', this.getUserActiveConversation(authSocket.data.user._id));
  }


  // change conversation
  @SubscribeMessage(
    chat_gateway_constants.subscription_events.change_conversation,
  )
  changeConversation(authSocket: AuthenticatedSocket, conversationId: string) {
    // TODO: Add validation to check if the requested conversationId is associated with the user
    
    // Remove the user's active conversation
    this.removeUserActiveConversation(authSocket.data.user._id);
    this.logger.log(
      `User (${authSocket.data.user._id}) removed as active for conversation`,
    );
    
    // Set the user's active conversation
    this.setUserActiveConversation(authSocket.data.user._id, conversationId);
    this.logger.log(
      `Conversation (${conversationId}) set as active for user (${authSocket.data.user._id})`,
    );
  }
  
  
  

  // ***********************
  // Emit methods
  // ***********************

  /**
   * Emits a message notification to the recipients in the following cases:
   * - recipients are connected to the chat-socket
   * - recipients do not have the conversation as the active conversation
   */
  emitMessageNotificationToRecipients(
    recipientIds: string[],
    // TODO: Accept the exact notification payload or create-and-user a prepareMessageNotificaiton private method
    message: Message,
  ) {
    // ******************************
    // ******************************
    // Get the recipients of the conversation by checking the users in the conversation room
    // ******************************
    this.logger.debug('🍌 Getting the recipients of the conversation');

    let validRecipientsOfMessageNotification: string[] = [];

    // Get the connection against each recipientId
    for (const recipientId of recipientIds) {
      const connection = this.socketStoreService.getConnection({
        userId: recipientId.toString(),
      });

      if (!connection) continue;

      const { userId: connUserId } = connection;

      // Check if the active conversation of current connectedUser is the same as active conversation of the message
      const messageExistsInActiveConversationOfConnectedUser =
        this.isActiveConversationOfUser(
          connUserId,
          message.conversation_id.toString(),
        );

      // No need to send a message-notification to the user if the message is in the active conversation of the user
      if (!messageExistsInActiveConversationOfConnectedUser) {
        // Append the user to the valid recipients if the message notification
        validRecipientsOfMessageNotification.push(connUserId);
      }
    }

    // ******************************
    // Send the message notification to the valid recipients
    // ******************************

    // Retrieve the event name
    const msgNotificationEvent =
      chat_gateway_constants.emit_events.notification_message;

    this.logger.debug(
      `🍌 Sending the message notification to the valid recipients`,
    );

    // Send the message notification to the valid recipients
    this.server
      .to(validRecipientsOfMessageNotification)
      .emit(msgNotificationEvent, {
        conversationId: message.conversation_id.toString(),
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
      chat_gateway_constants.emit_events.conversation_message;

    // Send the message only to the conversation room
    this.server.to(conversationRoom).emit(conversationEvent, data);
  }
}
