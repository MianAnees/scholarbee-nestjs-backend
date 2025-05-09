import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { ContactService } from '../services/contact.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
    },
    namespace: '/contact-us',
})
export class ContactGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger('ContactGateway');

    constructor(
        @Inject(forwardRef(() => ContactService))
        private readonly contactService: ContactService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    afterInit(server: Server) {
        this.logger.log('Contact WebSocket Gateway initialized');
    }

    handleConnection(client: Socket, ...args: any[]) {
        this.logger.log(`Client connected: ${client.id}`);

        // Authenticate the client
        const token = client.handshake.headers.authorization?.split(' ')[1];
        if (token) {
            try {
                const payload = this.jwtService.verify(token, {
                    secret: this.configService.get<string>('JWT_SECRET'),
                });
                client.data.user = payload;
                this.logger.log(`Authenticated user: ${payload.email}`);
            } catch (error) {
                this.logger.error(`Authentication failed: ${error.message}`);
            }
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinAdminRoom')
    handleJoinAdminRoom(client: Socket) {
        client.join('admin_room');
        this.logger.log(`Client ${client.id} joined admin room`);
        return { event: 'joinedAdminRoom', data: { success: true } };
    }

    @SubscribeMessage('joinCampusRoom')
    handleJoinCampusRoom(client: Socket, campusId: string) {
        client.join(`campus_${campusId}`);
        this.logger.log(`Client ${client.id} joined campus room: ${campusId}`);
        return { event: 'joinedCampusRoom', data: { campusId } };
    }

    // Method to emit contact updates to clients
    emitContactUpdate(contact: any) {
        this.logger.log(`Emitting contact update for: ${contact._id}`);

        // Emit to all clients
        this.server.emit('contactUpdate', contact);

        // Emit to admin room
        this.server.to('admin_room').emit('adminContactUpdate', contact);

        // Emit to specific campus rooms if campusesIds exist
        if (contact.campusesIds && contact.campusesIds.length > 0) {
            contact.campusesIds.forEach(campusId => {
                this.server.to(`campus_${campusId}`).emit('campusContactUpdate', contact);
            });
        }
    }
} 