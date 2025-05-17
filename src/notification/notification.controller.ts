import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { ResourceProtectionGuard } from 'src/auth/guards/resource-protection.guard';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './services/notfication.service';
import { AuthReq } from 'src/auth/decorators/auth-req.decorator';
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';
import { QueryNotificationDto } from './dto/query-notification.dto';

@UseGuards(ResourceProtectionGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationGateway: NotificationGateway,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('test/user/global')
  sendGlobalTestNotificationToUser(@Body() payload: Record<string, any>) {
    this.notificationGateway.emitUserGlobalNotification(payload);
    return { success: true };
  }






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

  @Post('create')
  async createNotification(
    @AuthReq() authReq: AuthenticatedRequest,
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    const notification = await this.notificationService.createNotification(
      authReq.user,
      createNotificationDto,
    );
    return notification;
  }

  @Get()
  async getUserNotifications(
    @AuthReq() authReq: AuthenticatedRequest,
    @Query() queryDto: QueryNotificationDto,
  ) {
    const userId = authReq.user._id;
    return this.notificationService.getUserNotifications(userId, queryDto);
  }
}
