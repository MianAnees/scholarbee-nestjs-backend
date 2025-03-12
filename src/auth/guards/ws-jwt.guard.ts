import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
    private readonly logger = new Logger('WsJwtGuard');

    constructor(private jwtService: JwtService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client: Socket = context.switchToWs().getClient();
        this.logger.debug(`Checking JWT for client ${client.id}`);

        const token = client.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
            this.logger.warn(`No token provided for client ${client.id}`);
            throw new WsException('Unauthorized');
        }

        try {
            const payload = this.jwtService.verify(token);
            this.logger.debug(`Token verified for user ${payload.sub}`);

            // Attach user to client for future use
            client.data.user = payload;
            return true;
        } catch (error) {
            this.logger.error(`Invalid token: ${error.message}`);
            throw new WsException('Invalid token');
        }
    }
} 