import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { CreateGlobalNotificationDto, CreateSpecificNotificationDto } from '../dto/create-notification.dto';
import {
  NotificationQuery,
  QueryNotificationDto,
} from '../dto/query-notification.dto';
import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  // Creates a global notification for all users
  async createGlobalUserNotification(
    createGlobalNotificationDto: CreateGlobalNotificationDto,
  ): Promise<NotificationDocument> {
    // TODO: Send the global notification to all users active on the platform (through the gateway)

    try {
      const notification = new this.notificationModel({
        ...createGlobalNotificationDto,
        audience: {
          audienceType: 'User',
          isGlobal: true,
          recipients: [],
        },
      });
      const savedNotification = await notification.save();
      // Emit to all active users via gateway
      this.notificationGateway.emitUserGlobalNotification(savedNotification.toObject());
      return savedNotification;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  // Creates a notification for specific users
  async createSpecificUsersNotification(
    createSpecificNotificationDto: CreateSpecificNotificationDto,
  ): Promise<NotificationDocument> {
    try {
      const { userIds, ...notificationPayload } = createSpecificNotificationDto;

      const notification = new this.notificationModel({
        ...notificationPayload,
        audience: {
          audienceType: 'User',
          isGlobal: false,
          recipients: userIds.map((id) => ({ id, isRead: false })),
        },
      });
      return notification.save();
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  private getUserNotificationsQuery(
    userId: string,
    queryDto: Pick<QueryNotificationDto, 'read_status' | 'scope'>,
  ): RootFilterQuery<NotificationDocument> {
    const { read_status, scope } = queryDto;

    let match: RootFilterQuery<NotificationDocument> = {};

    // 1. read_status: NotificationReadStatus.ANY, scope: NotificationScope.ALL
    if (
      read_status === NotificationQuery.ReadStatus.ANY &&
      scope === NotificationQuery.Scope.ALL
    ) {
      // No filters: return all notifications for user (global and specific)
      match = {
        $or: [
          // Global notifications
          {
            'audience.audienceType': 'User',
            'audience.isGlobal': true,
          },
          // Specific notifications (irrespective of read status)
          {
            'audience.audienceType': 'User',
            'audience.isGlobal': false,
            'audience.recipients': { $elemMatch: { id: userId } },
          },
        ],
      };
    }

    // 2. read_status: NotificationReadStatus.ANY, scope: NotificationScope.GLOBAL
    if (
      read_status === NotificationQuery.ReadStatus.ANY &&
      scope === NotificationQuery.Scope.GLOBAL
    ) {
      // Only global notifications irrespective of read status
      match = {
        'audience.audienceType': 'User',
        'audience.isGlobal': true,
      };
    }

    // 3. read_status: NotificationReadStatus.ANY, scope: NotificationScope.SPECIFIC
    if (
      read_status === NotificationQuery.ReadStatus.ANY &&
      scope === NotificationQuery.Scope.SPECIFIC
    ) {
      // Only specific notifications irrespective of read status
      match = {
        'audience.audienceType': 'User',
        'audience.isGlobal': false,
        'audience.recipients': { $elemMatch: { id: userId } },
      };
    }

    // 4. read_status: NotificationReadStatus.UNREAD, scope: NotificationScope.GLOBAL
    if (
      read_status === NotificationQuery.ReadStatus.UNREAD &&
      scope === NotificationQuery.Scope.GLOBAL
    ) {
      // Only global notifications
      match = {
        'audience.audienceType': 'User',
        'audience.isGlobal': true,
        // TODO: Right now, there's no way to filter unread global notifications (as read receipts is not tracked for global notifications)
      };
    }

    // 5. read_status: NotificationReadStatus.UNREAD, scope: NotificationScope.SPECIFIC
    if (
      read_status === NotificationQuery.ReadStatus.UNREAD &&
      scope === NotificationQuery.Scope.SPECIFIC
    ) {
      match = {
        'audience.audienceType': 'User',
        'audience.isGlobal': false,
        'audience.recipients': { $elemMatch: { id: userId, isRead: false } },
      };
    }

    return match;
  }

  async getUserNotifications(userId: string, queryDto: QueryNotificationDto) {
    const { read_status, scope, limit, sortBy, sortOrder, skip } = queryDto;

    const match = this.getUserNotificationsQuery(userId, {
      read_status,
      scope,
    });

    // Run aggregation or find
    const notifications = await this.notificationModel
      .find(match)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec();

    return notifications;
  }
}
