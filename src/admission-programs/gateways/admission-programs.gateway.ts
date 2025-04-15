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
import { AdmissionProgramsService } from '../services/admission-programs.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Authorization', 'Content-Type']
    },
    namespace: '/admission-programs',
})
export class AdmissionProgramsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private readonly logger = new Logger('AdmissionProgramsGateway');

    constructor(
        @Inject(forwardRef(() => AdmissionProgramsService))
        private readonly admissionProgramsService: AdmissionProgramsService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    afterInit(server: Server) {
        this.logger.log('Admission Programs WebSocket Gateway initialized');
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

    @SubscribeMessage('joinAdmission')
    handleJoinAdmission(client: Socket, admissionId: string) {
        client.join(`admission_${admissionId}`);
        this.logger.log(`Client ${client.id} joined admission room: ${admissionId}`);
        return { event: 'joinedAdmission', data: { admissionId } };
    }

    @SubscribeMessage('joinProgram')
    handleJoinProgram(client: Socket, programId: string) {
        client.join(`program_${programId}`);
        this.logger.log(`Client ${client.id} joined program room: ${programId}`);
        return { event: 'joinedProgram', data: { programId } };
    }

    // Method to emit admission program updates to clients
    emitAdmissionProgramUpdate(admissionProgram: any) {
        this.logger.log(`Emitting admission program update for: ${admissionProgram._id}`);

        // Emit to all clients
        this.server.emit('admissionProgramUpdate', admissionProgram);

        // Emit to specific admission room
        if (admissionProgram.admission) {
            this.server.to(`admission_${admissionProgram.admission}`).emit('admissionProgramUpdate', admissionProgram);
        }

        // Emit to specific program room
        if (admissionProgram.program) {
            this.server.to(`program_${admissionProgram.program}`).emit('programAdmissionUpdate', admissionProgram);
        }
    }
} 