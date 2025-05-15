import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationGateway } from './notification.gateway';
import { NotificationController } from './notification.controller';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import { NotificationService } from './services/notfication.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IConfiguration } from 'src/config/configuration';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<IConfiguration>) => ({
        secret: configService.get('jwt.loginSecret', { infer: true }),
        signOptions: {
          expiresIn: `${configService.get('jwt.loginExpiration', { infer: true })}s`,
        }, // Access token expires in 15 minutes
      }),
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationGateway, NotificationService],
  exports: [NotificationGateway, NotificationService],
})
export class NotificationModule {}
