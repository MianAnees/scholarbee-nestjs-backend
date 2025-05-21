import { UseGuards } from '@nestjs/common';
import { WebSocketGateway } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { WsJwtGuard } from 'src/auth/guards/ws-jwt.guard';
import { AuthenticatedSocket } from 'src/auth/types/auth.interface';
import { AuthenticatedConnectionStoreGateway } from 'src/common/gateway/authenticated-connection-store.gateway';

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

  // Only inject the services needed for this gateway
  constructor(
    // private readonly chatService: ChatService,
    protected readonly authService: AuthService, // Do not redeclare as private/protected, just pass to super
  ) {
    super(authService);
  }

  protected onAuthenticatedConnectionStoreInit(server: Server): void {
    this.logger.log('ChatGateway initialized');
  }

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

  // Custom logic for disconnects
  protected onAuthenticatedConnectionStoreDisconnect(
    client: AuthenticatedSocket,
  ) {
    this.logger.log(`Client disconnected: ${client.id}`);
    // ... your custom logic here ...
  }

  // Method to emit events from outside the gateway
  emitToConversation(conversationId: string, event: string, data: any) {
    this.logger.log(`Emitting ${event} to conversation: ${conversationId}`);
    console.log('Emitting event:', event, 'to conversation:', conversationId);

    // Broadcast to all clients
    this.server.emit(conversationId, {
      ...data,
    });
  }
}
