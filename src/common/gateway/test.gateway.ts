import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/test' })
export class TestGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
    const queryToken = client.handshake.query.token;
    const headerToken = client.handshake.headers.authorization?.split(' ')[1];
    console.log(
      '🚀 ~ TestGateway ~ handleConnection ~ headerToken:',
      headerToken,
    );
    const token = queryToken || headerToken;
    console.log('Client connected:', client.id);
    console.log('Token received:', token);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }
}
