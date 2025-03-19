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
import { AdmissionsService } from '../services/admissions.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
    },
    namespace: '/admissions',
})
export class AdmissionsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger('AdmissionsGateway');

    constructor(
        @Inject(forwardRef(() => AdmissionsService))
        private readonly admissionsService: AdmissionsService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    afterInit(server: Server) {
        this.logger.log('Admissions WebSocket Gateway initialized');
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

    @SubscribeMessage('joinUniversity')
    handleJoinUniversity(client: Socket, universityId: string) {
        client.join(`university_${universityId}`);
        this.logger.log(`Client ${client.id} joined university room: ${universityId}`);
        return { event: 'joinedUniversity', data: { universityId } };
    }

    @SubscribeMessage('joinCampus')
    handleJoinCampus(client: Socket, campusId: string) {
        client.join(`campus_${campusId}`);
        this.logger.log(`Client ${client.id} joined campus room: ${campusId}`);
        return { event: 'joinedCampus', data: { campusId } };
    }

    // Method to emit admission updates to clients
    emitAdmissionUpdate(admission: any) {
        this.logger.log(`Emitting admission update for: ${admission._id}`);

        // Emit to all clients
        this.server.emit('admissionUpdate', admission);

        // Emit to specific university room
        if (admission.university_id) {
            this.server.to(`university_${admission.university_id}`).emit('universityAdmissionUpdate', admission);
        }

        // Emit to specific campus room
        if (admission.campus_id) {
            this.server.to(`campus_${admission.campus_id}`).emit('campusAdmissionUpdate', admission);
        }
    }
} 