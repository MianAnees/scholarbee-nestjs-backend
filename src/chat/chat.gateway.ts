import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
    cors: {
        origin: '*', // For development - change to specific origins in production
        methods: ['GET', 'POST'],
        credentials: true,
    },
    namespace: 'chat',
    transports: ['websocket', 'polling'], // Allow both WebSocket and polling
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    constructor(
        private readonly chatService: ChatService,
        private readonly jwtService: JwtService,
    ) {
        this.logger.log('ChatGateway created');
    }

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway initialized');
    }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.query.token as string;
            if (!token) {
                this.logger.error('No token provided');
                client.disconnect();
                return;
            }

            // Verify the token
            const payload = this.jwtService.verify(token);
            const userId = payload.id;

            // Store the user ID with the socket
            client.data.userId = userId;

            this.logger.log(`Client connected: ${client.id}, User: ${userId}`);

            // Join a room specific to this user
            client.join(`user_${userId}`);

            // Notify the client of successful connection
            client.emit('connection_established', {
                message: 'Successfully connected to chat server',
                userId: userId
            });

        } catch (error) {
            this.logger.error(`Connection error: ${error.message}`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    // Method to emit events from outside the gateway
    emitToConversation(conversationId: string, event: string, data: any) {
        this.logger.log(`Emitting ${event} to conversation: ${conversationId}`);
        console.log('Emitting event:', event, 'to conversation:', conversationId);

        // Broadcast to all clients
        this.server.emit(conversationId, {
            ...data
        });
    }

    // @SubscribeMessage('message')
    // handleMessage(client: Socket, payload: { conversationId: string, message: string }) {
    //     this.logger.log(`Received message for conversation ${payload.conversationId}: ${payload.message}`);
    //     this.server.to(payload.conversationId).emit('message', payload.message);
    // }
}
