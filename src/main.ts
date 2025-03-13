import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PopulateInterceptor } from './common/interceptors/populate.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import * as dotenv from 'dotenv';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { Server } from 'socket.io';

// Load environment variables at the very beginning
dotenv.config();

class CustomIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: Partial<ServerOptions>): any {
    const server = new Server({
      cors: {
        origin: ['https://api-dev.scholarbee.pk', 'https://ws.api-dev.scholarbee.pk'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket'], // Ensures WebSocket-only connections
    });
    return server;
  }
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting application...');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get config service
  const configService = app.get(ConfigService);

  // Enable CORS with explicit configuration
  app.enableCors({
    origin: ['https://api-dev.scholarbee.pk', 'https://ws.api-dev.scholarbee.pk'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // Use custom WebSocket adapter for proper handling
  logger.log('Configuring WebSocket adapter...');
  app.useWebSocketAdapter(new CustomIoAdapter(app));

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }));

  // API prefix
  app.setGlobalPrefix('api');

  // Get the PopulateInterceptor instance from the app context instead of creating a new one
  const populateInterceptor = app.get(PopulateInterceptor);
  app.useGlobalInterceptors(populateInterceptor);
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('ScholarBee API')
    .setDescription('The ScholarBee API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Get port from environment or use default
  const port = configService.get<number>('PORT') || 3010;

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation is available at: http://localhost:${port}/api/docs`);
  logger.log(`WebSocket server is available at: ws://localhost:${port}/socket.io`);
}
bootstrap();
