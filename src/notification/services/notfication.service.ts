import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import {
  NotificationDocument,
  Notification,
} from '../schemas/notification.schema';
import {
  NotificationQuery,
  QueryNotificationDto,
} from '../dto/query-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  // Creates a new notification for a user
  async createNotification(
    user: AuthenticatedRequest['user'],
    createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationDocument> {
    try {
      const notification = new this.notificationModel(createNotificationDto);
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
