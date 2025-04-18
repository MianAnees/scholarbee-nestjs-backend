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
import { ApplicationsService } from '../services/applications.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
    },
    namespace: '/applications',
})
export class ApplicationsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger('ApplicationsGateway');

    constructor(
        @Inject(forwardRef(() => ApplicationsService))
        private readonly applicationsService: ApplicationsService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    afterInit(server: Server) {
        this.logger.log('Applications WebSocket Gateway initialized');
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

    @SubscribeMessage('joinApplicantRoom')
    handleJoinApplicantRoom(client: Socket, applicantId: string) {
        client.join(`applicant_${applicantId}`);
        this.logger.log(`Client ${client.id} joined applicant room: ${applicantId}`);
        return { event: 'joinedApplicantRoom', data: { applicantId } };
    }

    @SubscribeMessage('joinCampusRoom')
    handleJoinCampusRoom(client: Socket, campusId: string) {
        client.join(`campus_${campusId}`);
        this.logger.log(`Client ${client.id} joined campus room: ${campusId}`);
        return { event: 'joinedCampusRoom', data: { campusId } };
    }

    @SubscribeMessage('joinProgramRoom')
    handleJoinProgramRoom(client: Socket, programId: string) {
        client.join(`program_${programId}`);
        this.logger.log(`Client ${client.id} joined program room: ${programId}`);
        return { event: 'joinedProgramRoom', data: { programId } };
    }

    // Method to emit application updates to clients
    emitApplicationUpdate(application: any) {
        this.logger.log(`Emitting application update for: ${application._id}`);

        // Emit to all clients
        this.server.emit('applicationUpdate', application);

        // Emit to specific applicant room
        if (application.applicant) {
            this.server.to(`applicant_${application.applicant}`).emit('applicationUpdate', application);
        }

        // Emit to specific campus room
        if (application.campus_id) {
            this.server.to(`campus_${application.campus_id}`).emit('campusApplicationUpdate', application);
        }

        // Emit to specific program room
        if (application.program) {
            this.server.to(`program_${application.program}`).emit('programApplicationUpdate', application);
        }
    }
} 