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

  async getUserNotifications(userId: string, queryDto: QueryNotificationDto) {
    const { read_status, scope, limit, sortBy, sortOrder, skip } = queryDto;

    const match = this.getSharedNotificationsQuery(userId, { read_status, scope }, AudienceType.User);

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
   * @param recipientId - The campus ID
   * @param queryDto - QueryCampusNotificationDto
   */
  private getSharedNotificationsQuery(
    recipientId: string,
    queryDto: Pick<QueryNotificationDto, 'read_status' | 'scope'>,
    audienceType: AudienceType,
  ): RootFilterQuery<NotificationDocument> {
    const { read_status, scope } = queryDto;

    // Combination: ALL + ANY
    if (scope === NotificationQuery.Scope.ALL && read_status === NotificationQuery.ReadStatus.ANY) {
      return {
        'audience.audienceType': audienceType,
        $or: [
          { 'audience.isGlobal': true },
          { 'audience.isGlobal': false, 'audience.recipients': { $elemMatch: { id: recipientId } } },
        ],
      };
    }

    // Combination: ALL + UNREAD
    if (scope === NotificationQuery.Scope.ALL && read_status === NotificationQuery.ReadStatus.UNREAD) {
      return {
        'audience.audienceType': audienceType,
        $or: [
          { 'audience.isGlobal': true },
          { 'audience.isGlobal': false, 'audience.recipients': { $elemMatch: { id: recipientId, isRead: false } } },
        ],
      };
    }

    // Combination: GLOBAL + ANY
    if (scope === NotificationQuery.Scope.GLOBAL && read_status === NotificationQuery.ReadStatus.ANY) {
      return {
        'audience.audienceType': audienceType,
        'audience.isGlobal': true,
      };
    }

    // Combination: GLOBAL + UNREAD
    if (scope === NotificationQuery.Scope.GLOBAL && read_status === NotificationQuery.ReadStatus.UNREAD) {
      // No read tracking for global, so just return all global
      return {
        'audience.audienceType': audienceType,
        'audience.isGlobal': true,
        // TODO: Right now, there's no way to filter unread global notifications (as read receipts is not tracked for global notifications)
      };
    }

    // Combination: SPECIFIC + ANY
    if (scope === NotificationQuery.Scope.SPECIFIC && read_status === NotificationQuery.ReadStatus.ANY) {
      return {
        'audience.audienceType': audienceType,
        'audience.isGlobal': false,
        'audience.recipients': { $elemMatch: { id: recipientId } },
      };
    }

    // Combination: SPECIFIC + UNREAD
    if (scope === NotificationQuery.Scope.SPECIFIC && read_status === NotificationQuery.ReadStatus.UNREAD) {
      return {
        'audience.audienceType': audienceType,
        'audience.isGlobal': false,
        'audience.recipients': { $elemMatch: { id: recipientId, isRead: false } },
      };
    }

    // Fallback (should not be reached)
    return {
      'audience.audienceType': audienceType,
      $or: [
        { 'audience.isGlobal': true },
        { 'audience.isGlobal': false, 'audience.recipients': { $elemMatch: { id: recipientId } } },
      ],
    };
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
    const { limit, sortBy, sortOrder, skip, read_status, scope } = queryDto;

    const campusId = user.campus_id;
    const match = this.getSharedNotificationsQuery(campusId, { read_status, scope }, AudienceType.Campus);
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
