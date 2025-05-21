import { UseGuards } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';
import { AuthService } from 'src/auth/auth.service';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt.guard';
import { AuthenticatedConnectionStoreGateway } from 'src/common/gateway/authenticated-connection-store.gateway';

@WebSocketGateway({
  cors: {
    origin: '*', // For development - change to specific origins in production
    methods: ['GET', 'POST'],
    credentials: true,
  },
  namespace: 'chat-notification',
  transports: ['websocket', 'polling'], // Allow both WebSocket and polling
})
@UseGuards(WsJwtGuard)
export class ChatNotificationGateway extends AuthenticatedConnectionStoreGateway {
  // @WebSocketServer()
  // server: Server;

  // Only inject the services needed for this gateway
  constructor(
    // private readonly chatService: ChatService,
    protected readonly authService: AuthService, // Do not redeclare as private/protected, just pass to super
  ) {
    super(authService);
  }

  // ***********************
  // Event methods
  // ***********************

  // TODO: Explore the possibility of using notification collection for different types of notifications with conditional notification payloads

  // TODO: add a method to emit a message notification to a specific user
  // If the user is not active in the chat, the socket against the user should be found in the message-notification-store
  // If user is found active, in the message-notification-store, the socket should be used to emit the message notification with the detail of the message
}
