import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';
import { NotificationService } from './services/notfication.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
    AuthModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationGateway, NotificationService],
  exports: [NotificationGateway, NotificationService],
})
export class NotificationModule {}
