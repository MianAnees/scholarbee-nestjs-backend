import { Controller, Post, Param } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationGateway: NotificationGateway) {}

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
