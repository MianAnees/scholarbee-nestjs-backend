import { BadRequestException, Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { CreateGlobalNotificationDto, CreateSpecificNotificationDto, CreateCampusGlobalNotificationDto, CreateSpecificCampusesNotificationDto } from '../dto/create-notification.dto';
import {
  NotificationQuery,
  QueryNotificationDto,
  QueryCampusNotificationDto,
} from '../dto/query-notification.dto';
import {
  AudienceType,
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';
import { UserNS } from 'src/users/schemas/user.schema';

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
      const notificationDoc: Notification = {
        ...createGlobalNotificationDto,
        audience: {
          audienceType: AudienceType.User,
          isGlobal: true,
          recipients: [],
        },
      }
      const notification = new this.notificationModel(notificationDoc);
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

      const notificationDoc: Notification = {
        ...notificationPayload,
        audience: {
          audienceType: AudienceType.User,
          isGlobal: false,
          recipients: userIds.map((id) => ({ id, isRead: false })),
        },
      }
      const notification = new this.notificationModel(notificationDoc);
      const savedNotification = await notification.save();

      // Emit to each active user via gateway
      this.notificationGateway.emitMultipleUserSpecificNotifications(userIds, savedNotification.toObject());

      return savedNotification;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  /**
   * Creates a global notification for all users in a campus.
   *
   * @param createCampusGlobalNotificationDto - DTO containing title, message, and campusId
   * @returns The created notification document
   */
  async createGlobalCampusNotification(
    createCampusGlobalNotificationDto: CreateCampusGlobalNotificationDto,
  ): Promise<NotificationDocument> {
    try {


      const notificationDoc: Notification = {
        ...createCampusGlobalNotificationDto,
        audience: {
          audienceType: AudienceType.Campus,
          isGlobal: true,
          recipients: [],
        },
      }
      const notification = new this.notificationModel(notificationDoc);
      const savedNotification = await notification.save();
      // (WS emit will be handled in controller or a separate method)
      return savedNotification;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  /**
   * Creates a notification for specific campuses.
   *
   * @param createSpecificCampusesNotificationDto - DTO containing title, message, and campusIds
   * @returns The created notification document
   */
  async createSpecificCampusesNotification(
    createSpecificCampusesNotificationDto: CreateSpecificCampusesNotificationDto,
  ): Promise<NotificationDocument> {
    try {
      const { campusIds, ...notificationPayload } = createSpecificCampusesNotificationDto;
      const notificationDoc: Notification = {
        ...notificationPayload,
        audience: {
          audienceType: AudienceType.Campus,
          isGlobal: false,
          recipients: campusIds.map((id) => ({ id, isRead: false })),
        },
      };
      const notification = new this.notificationModel(notificationDoc);
      const savedNotification = await notification.save();
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

  /**
   * Marks a single notification as read for a specific user.
   *
   * Only updates the recipient entry in the recipients array where elem.id matches the userId.
   * Does not affect other recipients.
   *
   * @param userId - The ID of the user marking the notification as read
   * @param notificationId - The notification document ID to mark as read
   * @returns True if the notification was updated, false otherwise
   */
  async markSingleNotificationAsRead(userId: string, notificationId: string): Promise<boolean> {
    const result = await this.notificationModel.updateOne(
      {
        _id: notificationId, // Only the specified notification
        'audience.recipients': { $elemMatch: { id: userId, isRead: false } }, // Only if user is a recipient and not already read
      },
      {
        $set: { 'audience.recipients.$[elem].isRead': true },
      },
      {
        // arrayFilters ensures that the $set update only applies to the recipient entry in the recipients array
        // where elem.id matches the userId (i.e., only the requesting user's isRead is set to true, not others)
        arrayFilters: [{ 'elem.id': userId }],
      },
    );
    // result.modifiedCount is 1 if the notification was updated, 0 otherwise
    return !!result.modifiedCount;
  }

  /**
   * Build the MongoDB query for campus notifications for a campus admin.
   * @param campusId - The campus ID
   * @param queryDto - QueryCampusNotificationDto
   */
  private getCampusNotificationsQuery(
    campusId: string,
    queryDto: QueryCampusNotificationDto,
  ) {
    const { read_status, scope } = queryDto;
    let match: RootFilterQuery<NotificationDocument> = {
      'audience.audienceType': AudienceType.Campus,
    };

    // Handle scope
    if (scope === NotificationQuery.Scope.ALL) {
      match.$or = [
        { 'audience.isGlobal': true },
        { 'audience.isGlobal': false, 'audience.recipients': { $elemMatch: { id: campusId } } },
      ];
    } else if (scope === NotificationQuery.Scope.GLOBAL) {
      match['audience.isGlobal'] = true;
    } else if (scope === NotificationQuery.Scope.SPECIFIC) {
      match['audience.isGlobal'] = false;
      match['audience.recipients'] = { $elemMatch: { id: campusId } };
    }

    // Handle read_status
    if (read_status === NotificationQuery.ReadStatus.UNREAD) {
      if (scope === NotificationQuery.Scope.ALL || !scope) {
        match.$or = [
          { 'audience.isGlobal': true },
          { 'audience.isGlobal': false, 'audience.recipients': { $elemMatch: { id: campusId, isRead: false } } },
        ];
      } else if (scope === NotificationQuery.Scope.SPECIFIC) {
        match['audience.recipients'] = { $elemMatch: { id: campusId, isRead: false } };
      }
      // For global, no read tracking, so just return all global
    }

    return match;
  }

  /**
   * Get notifications for a campus admin (all notifications for their campus, including global campus notifications)
   * @param user - The authenticated user object
   * @param queryDto - QueryCampusNotificationDto (pagination, scope, read_status)
   */
  async getCampusNotifications(user: AuthenticatedRequest['user'], queryDto: QueryCampusNotificationDto) {
    // Check if user is a campus admin
    if (!user || user.user_type !== UserNS.UserType.Campus_Admin || !user.campus_id) {
      throw new ForbiddenException('Only campus admins can access campus notifications');
    }
    const campusId = user.campus_id;
    const { limit, sortBy, sortOrder, skip } = queryDto;
    const match = this.getCampusNotificationsQuery(campusId, queryDto);
    // Add pagination and sorting
    const notifications = await this.notificationModel
      .find(match)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec();
    return notifications;
  }
}
