import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PopulateInterceptor } from './common/interceptors/populate.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import * as dotenv from 'dotenv';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Logger } from '@nestjs/common';

// Load environment variables at the very beginning
dotenv.config();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  logger.log('Starting application...');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Enable all log levels
  });

  // Get config service
  const configService = app.get(ConfigService);

  // Enable CORS with explicit configuration
  app.enableCors({
    origin: '*', // In production, replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });

  // Use WebSockets with explicit adapter
  logger.log('Configuring WebSocket adapter...');
  app.useWebSocketAdapter(new IoAdapter(app));

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
    .setTitle('ScolarBee API')
    .setDescription('The ScolarBee API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Get port from environment or use default
  const port = configService.get<number>('PORT') || 3000;

  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation is available at: http://localhost:${port}/api/docs`);
  logger.log(`WebSocket server is available at: ws://localhost:${port}/chat`);
}
bootstrap();
