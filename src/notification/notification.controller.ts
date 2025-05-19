import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { AuthReq } from 'src/auth/decorators/auth-req.decorator';
import { ResourceProtectionGuard } from 'src/auth/guards/resource-protection.guard';
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import {
  CreateCampusGlobalNotificationDto,
  CreateGlobalNotificationDto,
  CreateCampusSpecificNotificationsDto,
  CreateSpecificNotificationDto,
  MarkBulkNotificationsAsReadDto,
  MarkNotificationAsReadDto,
} from './dto/create-notification.dto';
import {
  QueryCampusNotificationDto,
  QueryNotificationDto,
} from './dto/query-notification.dto';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './services/notfication.service';
import { AudienceType } from 'src/notification/schemas/notification.schema';

@UseInterceptors(ResponseInterceptor)
@UseGuards(ResourceProtectionGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationGateway: NotificationGateway,
    private readonly notificationService: NotificationService,
  ) {}

  @Get('user')
  async getUserNotifications(
    @AuthReq() authReq: AuthenticatedRequest,
    @Query() queryDto: QueryNotificationDto,
  ) {
    return this.notificationService.getUserNotifications(
      authReq.user,
      queryDto,
    );
  }

  @Post('user/global')
  async createGlobalUserNotification(
    @AuthReq() authReq: AuthenticatedRequest,
    @Body() createGlobalNotificationDto: CreateGlobalNotificationDto,
  ) {
    const notification =
      await this.notificationService.createGlobalUserNotification(
        createGlobalNotificationDto,
      );
    return notification;
  }

  @Post('user/specific')
  async createSpecificUsersNotification(
    @AuthReq() authReq: AuthenticatedRequest,
    @Body() createSpecificNotificationDto: CreateSpecificNotificationDto,
  ) {
    const notification =
      await this.notificationService.createSpecificUsersNotification(
        createSpecificNotificationDto,
      );
    return notification;
  }

  @Post('campus/global')
  async createGlobalCampusNotification(
    @AuthReq() authReq: AuthenticatedRequest,
    @Body()
    createCampusGlobalNotificationDto: CreateCampusGlobalNotificationDto,
  ) {
    const notification =
      await this.notificationService.createGlobalCampusNotification(
        createCampusGlobalNotificationDto,
      );
    return notification;
  }

  @Post('campus/specific')
  async createCampusSpecificNotification(
    @AuthReq() authReq: AuthenticatedRequest,
    @Body()
    createCampusSpecificNotificationDto: CreateCampusSpecificNotificationsDto,
  ) {
    const notification =
      await this.notificationService.createCampusSpecificNotification(
        createCampusSpecificNotificationDto,
      );
    return notification;
  }

  @Patch('mark-read/bulk')
  async markBulkNotificationsAsRead(
    @AuthReq() authReq: AuthenticatedRequest,
    @Body() markNotificationsReadDto: MarkBulkNotificationsAsReadDto,
  ) {
    const userId = authReq.user._id;
    const { notificationIds } = markNotificationsReadDto;
    const updatedCount =
      await this.notificationService.markBulkNotificationsAsRead(
        userId,
        notificationIds,
      );
    return { updatedCount };
  }

  @Patch('mark-read/:notificationId')
  async markNotificationAsRead(
    @AuthReq() authReq: AuthenticatedRequest,
    @Param(new ValidationPipe({ transform: true }))
    params: MarkNotificationAsReadDto,
  ) {
    const userId = authReq.user._id;
    const { notificationId } = params;
    const updated = await this.notificationService.markNotificationAsRead(
      userId,
      notificationId,
    );
    return { updated };
  }

  @Get('campus')
  async getCampusNotifications(
    @AuthReq() authReq: AuthenticatedRequest,
    @Query() queryDto: QueryCampusNotificationDto,
  ) {
    return this.notificationService.getCampusNotifications(
      authReq.user,
      queryDto,
    );
  }
}