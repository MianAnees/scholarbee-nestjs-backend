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
      const savedNotification = await notification.save();

      // Emit to each active user via gateway
      this.notificationGateway.emitMultipleUserSpecificNotifications(userIds, savedNotification.toObject());

      return savedNotification;
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

  /**
   * Marks multiple notifications as read for a specific user.
   *
   * Each notification document contains an array of recipients, where each recipient has their own read status (isRead).
   * This method will only update the read status for the recipient entry matching the requesting user (userId),
   * and will NOT affect the read status of other users/recipients in the same notification document.
   *
   * @param userId - The ID of the user marking notifications as read
   * @param notificationIds - The list of notification document IDs to mark as read
   * @returns The number of notification documents updated (where the user's read status was changed)
   */
  async markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<number> {
    // Only update notifications where:
    // - The notification _id is in the provided list
    // - The user is a recipient (audience.recipients contains an entry with id=userId)
    // - The user's isRead status is currently false
    const result = await this.notificationModel.updateMany(
      {
        _id: { $in: notificationIds }, // Only notifications with these IDs
        'audience.recipients': { $elemMatch: { id: userId, isRead: false } }, // Only if user is a recipient and not already read
      },
      {
        // Set isRead to true for the recipient entry matching the userId
        $set: { 'audience.recipients.$[elem].isRead': true },
      },
      {
        // arrayFilters ensures that the $set update only applies to the recipient entry in the recipients array
        // where elem.id matches the userId (i.e., only the requesting user's isRead is set to true, not others)
        arrayFilters: [{ 'elem.id': userId }],
      },
    );
    // result.modifiedCount is the number of notification documents where the user's read status was updated
    return result.modifiedCount || 0;
  }
}
