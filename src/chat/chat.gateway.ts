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

@WebSocketGateway({
    cors: {
        origin: [
            'https://api-dev.scholarbee.pk',
            'https://ws.api-dev.scholarbee.pk',
            'https://scholarbee.pk',
            'https://www.scholarbee.pk',
            'http://localhost:3000',
            'http://localhost:3001'
        ],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Authorization', 'Content-Type']
    },
    namespace: '/chat',
    transports: ['websocket', 'polling'], // Allow both WebSocket and polling
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger('ChatGateway');

    constructor(private readonly jwtService: JwtService) {
        this.logger.log('ChatGateway created');
    }

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway initialized');
    }

    async handleConnection(client: Socket) {
        try {
            console.log('Client connected:', client.id);
            this.logger.log(`Client connected: ${client.id}`);

            // Extract JWT token from handshake query
            const token = client.handshake.auth?.token || client.handshake.query?.token;

            if (!token) {
                this.logger.warn(`Client ${client.id} connected without token`);
                client.disconnect(); // Disconnect unauthorized clients
                return;
            }

            // Verify JWT Token
            try {
                const decoded = this.jwtService.verify(token);
                this.logger.log(`User ${decoded.sub} authenticated via WebSocket`);
                client.join(decoded.sub); // Allow user to join their own room
            } catch (error) {
                this.logger.error(`Invalid token: ${error.message}`);
                client.disconnect(); // Disconnect if token is invalid
            }

        } catch (error) {
            this.logger.error(`Error handling connection: ${error.message}`, error.stack);
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
