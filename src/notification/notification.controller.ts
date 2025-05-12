import { Controller, Param, Post } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { SubscribeMessage } from '@nestjs/websockets';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationGateway: NotificationGateway) {}

  @Post('test/global')
  sendGlobalTestNotification() {
    const notification = {
      title: 'Test Notification',
      message: 'This is a test notification!',
      timestamp: new Date(),
    };
    const response =
      this.notificationGateway.emitNotificationToAll(notification);
    return response;
  }

  @Post('test/:userId')
  sendTestNotification(@Param('userId') userId: string) {
    const notification = {
      title: 'Test Notification',
      message: 'This is a test notification!',
      timestamp: new Date(),
    };
    this.notificationGateway.emitNotificationToUser(userId, notification);
    return { success: true };
  }
}
