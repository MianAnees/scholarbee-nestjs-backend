import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  Patch,
  Param,
  BadRequestException,
  ValidationPipe
} from '@nestjs/common';
import { AuthReq } from 'src/auth/decorators/auth-req.decorator';
import { ResourceProtectionGuard } from 'src/auth/guards/resource-protection.guard';
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';
import { CreateGlobalNotificationDto, CreateSpecificNotificationDto, MarkNotificationsReadDto, MarkSingleNotificationReadDto, CreateCampusGlobalNotificationDto, CreateSpecificCampusesNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationDto } from './dto/query-notification.dto';
import { NotificationGateway } from './notification.gateway';
import { NotificationService } from './services/notfication.service';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { ParseUUIDPipe } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';

@UseInterceptors(ResponseInterceptor)
@UseGuards(ResourceProtectionGuard)
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationGateway: NotificationGateway,
    private readonly notificationService: NotificationService,
  ) {}

  @Post('test/user/global')
  sendGlobalTestNotificationToUser(@Body() payload: Record<string, any>) {
    // TODO: Call the service to create a notification which should handle the WS and DB operations
    this.notificationGateway.emitUserGlobalNotification(payload);
    return { success: true };
  }

  @Post('test/user/specific')
  sendSpecificTestNotificationToUser(@Body() payload: Record<string, any>) {
    // TODO: Call the service to create a notification which should handle the WS and DB operations
    this.notificationGateway.emitUserSpecificNotification(payload.userId, payload);
    return { success: true };
  }

  @Get()
  async getUserNotifications(
    @AuthReq() authReq: AuthenticatedRequest,
    @Query() queryDto: QueryNotificationDto,
  ) {
    const userId = authReq.user._id;
    return this.notificationService.getUserNotifications(userId, queryDto);
  }

  @Post('user/global')
  async createGlobalUserNotification(
    @AuthReq() authReq: AuthenticatedRequest,
    @Body() createGlobalNotificationDto: CreateGlobalNotificationDto,
  ) {
    const notification = await this.notificationService.createGlobalUserNotification(
      createGlobalNotificationDto,
    );
    return notification;
  }

  @Post('user/specific')
  async createSpecificUsersNotification(
    @AuthReq() authReq: AuthenticatedRequest,
    @Body() createSpecificNotificationDto: CreateSpecificNotificationDto,
  ) {
    const notification = await this.notificationService.createSpecificUsersNotification(
      createSpecificNotificationDto,
    );
    return notification;
  }

  @Post('campus/global')
  async createGlobalCampusNotification(
    @AuthReq() authReq: AuthenticatedRequest,
    @Body() createCampusGlobalNotificationDto: CreateCampusGlobalNotificationDto,
  ) {
    const notification = await this.notificationService.createGlobalCampusNotification(
      createCampusGlobalNotificationDto,
    );
    this.notificationGateway.emitCampusGlobalNotification(notification.toObject());
    return notification;
  }

  @Post('campus/specific')
  async createSpecificCampusesNotification(
    @AuthReq() authReq: AuthenticatedRequest,
    @Body() createSpecificCampusesNotificationDto: CreateSpecificCampusesNotificationDto,
  ) {
    const notification = await this.notificationService.createSpecificCampusesNotification(
      createSpecificCampusesNotificationDto,
    );
    this.notificationGateway.emitSpecificCampusesNotification(createSpecificCampusesNotificationDto.campusIds, notification.toObject());
    return notification;
  }

  @Patch('mark-read')
  async markNotificationsAsRead(
    @AuthReq() authReq: AuthenticatedRequest,
    @Body() markNotificationsReadDto: MarkNotificationsReadDto,
  ) {
    const userId = authReq.user._id;
    const { notificationIds } = markNotificationsReadDto;
    const updatedCount = await this.notificationService.markNotificationsAsRead(userId, notificationIds);
    return { updatedCount };
  }

  @Patch('mark-read/single/:notificationId')
  async markSingleNotificationAsRead(
    @AuthReq() authReq: AuthenticatedRequest,
    @Param(new ValidationPipe({ transform: true })) params: MarkSingleNotificationReadDto,
  ) {
    const userId = authReq.user._id;
    const { notificationId } = params;
    const updated = await this.notificationService.markSingleNotificationAsRead(userId, notificationId);
    return { updated };
  }
}