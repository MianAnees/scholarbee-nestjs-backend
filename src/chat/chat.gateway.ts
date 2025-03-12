import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
    },
    namespace: '/chat',
    transports: ['websocket', 'polling'],
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger('ChatGateway');

    constructor(
        private readonly jwtService: JwtService,
    ) {
        this.logger.log('ChatGateway created');
    }

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway initialized');
    }

    async handleConnection(client: Socket) {
        try {
            console.log('Client connected:', client.id);
            this.logger.log(`Client connected: ${client.id}`);

            // For testing, allow connections without tokens
            const token = client.handshake.headers.authorization?.split(' ')[1];
            if (!token) {
                this.logger.warn(`Client ${client.id} connected without token (allowed for testing)`);
                return; // Allow connection without token for testing
            }

            // If token is provided, verify it
            try {
                const decoded = this.jwtService.verify(token);
                this.logger.log(`User ${decoded.sub} authenticated via WebSocket`);
            } catch (error) {
                this.logger.error(`Invalid token: ${error.message}`);
                // Don't disconnect for testing
            }

            // Join the client to the conversation room they're interested in
            // This is now handled by the client joining the room directly
        } catch (error) {
            this.logger.error(`Error handling connection: ${error.message}`, error.stack);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    // Method to emit events from outside the gateway
    emitToConversation(conversationId: string, event: string, data: any) {
        this.logger.log(`Broadcasting ${event} event for conversation: ${conversationId}`);
        console.log('Broadcasting event:', event, 'with data:', data);

        // Broadcast to all connected clients
        this.server.emit(conversationId, {
            ...data,
        });
    }
} 