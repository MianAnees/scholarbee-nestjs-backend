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

  private isMessageInActiveConversation(
    userId: string,
    messageConversationId: string,
  ) {
    const userActiveConversation = this.getUserActiveConversation(userId);
    if (!userActiveConversation) return false;

    return messageConversationId === userActiveConversation;
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
   * Emits a message notification to the each participant of the conversation
   * - if the conversation is not the active conversation of the participant
   * - AND if the participant is connected to the chat-socket
   */
  emitNotificationToMessageInActiveParticipants(
    conversationId: string,
    message: Message,
  ) {
    // Get the active participants of the conversation
    let inactiveParticipantIds: string[] = [];

    // TODO: get the sender and the receiver of the conversation
    const senderId = message.sender_id.toString();
    const receiverId = message.sender_id.toString();

    // TODO: check if the sender and the receiver are connected to the chat-socket (check the store)
    const isSenderConnected = this.isUserConnected(senderId);
    const isReceiverConnected = this.isUserConnected(receiverId);

    if (!isSenderConnected) inactiveParticipantIds.push(senderId);
    if (!isReceiverConnected) inactiveParticipantIds.push(receiverId);

    // Retrieve the event name
    const msgNotificationEvent =
      chat_gateway_constants.emit_events.new_message_notification;

    // Emit to the inactive participants
    this.server.to(inactiveParticipantIds).emit(msgNotificationEvent, {
      conversationId,
      messageId: message._id,
      senderId,
      receiverId,
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

  /**
   * Emits a message notification if the message belongs to a conversation that is not the active conversation
   */
  async emitMessageNotificationsIfRequired(
    userId: string,
    senderId: Types.ObjectId,
    conversationId: string,
    message: Message,
  ) {
    // check if the user is active in socket
    // check if the message conversation id is different than the active conversation id of the user
    // if the message conversation id is different than the active conversation id of the user, then send the notification
    // if the message conversation id is the same as the active conversation id of the user, then do nothing

    const isRecipientConnectedToChat = this.isUserConnected(userId);
    if (!isRecipientConnectedToChat) return;

    const isMessageInActiveConversation = this.isMessageInActiveConversation(
      userId,
      conversationId,
    );

    if (isMessageInActiveConversation) return;

    // TODO: Notification should be sent to the notification participants
    this.emitNotificationToMessageInActiveParticipants(conversationId, message);

    // TODO: REVIEW: Should this be sent to the room or to the user?
    this.emitToUser(
      userId,
      chat_gateway_constants.emit_events.new_message_notification,
      {
        senderId,
        conversationId,
        messageId: message._id,
        messageSnippet: message.content,
        timestamp: message.created_at,
        isGroupChat: false,
        message,
      },
    );
  }
}
