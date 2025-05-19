import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery, Types } from 'mongoose';
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { UserNS } from 'src/users/schemas/user.schema';
import {
  CreateCampusGlobalNotificationDto,
  CreateGlobalNotificationDto,
  CreateSpecificCampusesNotificationDto,
  CreateSpecificNotificationDto,
} from '../dto/create-notification.dto';
import {
  NotificationQuery,
  QueryCampusNotificationDto,
  QueryNotificationDto,
} from '../dto/query-notification.dto';
import {
  AudienceType,
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';
import { NotificationReadReceiptDocument } from '../schemas/notification-read-receipt.schema';
import { NotificationReadReceipt } from '../schemas/notification-read-receipt.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationReadReceipt.name)
    private notificationReadReceiptModel: Model<NotificationReadReceiptDocument>,
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
      };
      const notification = new this.notificationModel(notificationDoc);
      const savedNotification = await notification.save();
      // Emit to all active users via gateway
      this.notificationGateway.emitUserGlobalNotification(
        savedNotification.toObject(),
      );
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

      const userObjectIds = userIds.map((id) => new Types.ObjectId(id));

      const notificationDoc: Notification = {
        ...notificationPayload,
        audience: {
          audienceType: AudienceType.User,
          isGlobal: false,
          recipients: userObjectIds,
        },
      };
      console.log(
        '🚀 ~ NotificationService ~ notificationDoc:',
        notificationDoc,
      );
      const notification = new this.notificationModel(notificationDoc);
      const savedNotification = await notification.save();

      // Emit to each active user via gateway
      this.notificationGateway.emitMultipleUserSpecificNotifications(
        userIds,
        savedNotification.toObject(),
      );

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
      };
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
      const { campusIds, ...notificationPayload } =
        createSpecificCampusesNotificationDto;
      const notificationDoc: Notification = {
        ...notificationPayload,
        audience: {
          audienceType: AudienceType.Campus,
          isGlobal: false,
          recipients: campusIds.map((id) => new Types.ObjectId(id)),
        },
      };
      const notification = new this.notificationModel(notificationDoc);
      const savedNotification = await notification.save();
      return savedNotification;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  /**
   * Marks multiple notifications as read for a specific user.
   *
   * This method uses a unique compound index on (notificationId, userId) in the NotificationReadReceipt collection
   * to ensure that each user can only have one read receipt per notification. This prevents duplicate entries.
   *
   * The method uses bulkWrite with updateOne and upsert: true for each notificationId. This means:
   *   - If a read receipt for (notificationId, userId) already exists, MongoDB does nothing (no error, no new document).
   *   - If it does not exist, MongoDB creates a new read receipt with the current timestamp.
   *
   * This is safe for cases where the client may select a mix of read and unread notifications:
   *   - Already-read notifications are ignored (no error, no duplicate).
   *   - Unread notifications get a new read receipt.
   *
   * @param userId - The ID of the user marking notifications as read
   * @param notificationIds - The list of notification document IDs to mark as read
   * @returns The number of notifications for which an upsert was attempted (not necessarily the number of new receipts created)
   */
  async markBulkNotificationsAsRead(
    userId: string,
    notificationIds: string[],
  ): Promise<number> {
    // Convert userId and notificationIds to ObjectId for MongoDB
    const userObjectId = new Types.ObjectId(userId);
    const notificationObjectIds = notificationIds.map(
      (id) => new Types.ObjectId(id),
    );
    const readTime = new Date();

    // Prepare bulkWrite operations: one upsert per notificationId
    // $setOnInsert ensures readAt is only set if a new document is created
    // upsert: true means if the document exists, do nothing; if not, insert
    const operations = notificationObjectIds.map((notificationId) => ({
      updateOne: {
        filter: { notificationId, userId: userObjectId },
        update: { $setOnInsert: { readAt: readTime } },
        upsert: true,
      },
    }));

    // Execute all upserts in a single bulkWrite operation
    // Thanks to the unique index, no duplicates will be created
    // No errors will be thrown for already existing read receipts
    if (operations.length > 0) {
      await this.notificationReadReceiptModel.bulkWrite(operations);
    }
    // Return the number of upsert attempts (not the number of new receipts)
    return operations.length;
  }

  /**
   * Marks a single notification as read for a specific user.
   *
   * Uses updateOne with upsert: true and $setOnInsert to ensure that:
   *   - If a read receipt for (notificationId, userId) exists, do nothing (no error, no duplicate).
   *   - If it does not exist, create a new read receipt with the current timestamp.
   *
   * This is safe and idempotent, and works seamlessly with the unique index.
   *
   * @param userId - The ID of the user marking the notification as read
   * @param notificationId - The notification document ID to mark as read
   * @returns True (operation always succeeds or is a no-op)
   */
  async markNotificationAsRead(
    userId: string,
    notificationId: string,
  ): Promise<boolean> {
    // Convert IDs to ObjectId for MongoDB
    const userObjectId = new Types.ObjectId(userId);
    const notificationObjectId = new Types.ObjectId(notificationId);
    const readTime = new Date();

    // Upsert the read receipt: create if not exists, do nothing if exists
    await this.notificationReadReceiptModel.updateOne(
      { notificationId: notificationObjectId, userId: userObjectId },
      { $setOnInsert: { readAt: readTime } },
      { upsert: true },
    );
    // Always return true (operation is safe and idempotent)
    return true;
  }

  /**
   * Build the MongoDB query for campus notifications for a campus admin.
   * @param recipientObjectId - The campus ID
   * @param queryScope - QueryCampusNotificationDto
   */
  private getSharedNotificationsQuery(
    recipientObjectId: Types.ObjectId,
    scope: QueryNotificationDto['scope'],
    audienceType: AudienceType,
  ): RootFilterQuery<NotificationDocument> {
    // Global notifications only
    if (scope === NotificationQuery.Scope.GLOBAL) {
      console.log('🚀 ~ GLOBAL:', scope);
      return {
        'audience.audienceType': audienceType,
        'audience.isGlobal': true,
      };
    }

    // Specific notifications only
    if (scope === NotificationQuery.Scope.SPECIFIC) {
      console.log('🚀 ~ SPECIFIC:', scope);
      return {
        'audience.audienceType': audienceType,
        'audience.isGlobal': false,
        // recipientId should be checked within the array of recipients in the notification document
        'audience.recipients': { $in: [recipientObjectId] },
      };
    }

    // All notifications (global + specific)
    console.log('🚀 ~ All notifications:', scope);
    return {
      'audience.audienceType': audienceType,
      $or: [
        { 'audience.isGlobal': true },
        {
          'audience.isGlobal': false,
          'audience.recipients': { $in: [recipientObjectId] },
        },
      ],
    };
  }

  async getUserNotifications(userId: string, queryDto: QueryNotificationDto) {
    const { read_status, scope, limit, sortBy, sortOrder, skip } = queryDto;

    const userObjectId = new Types.ObjectId(userId);

    const match = this.getSharedNotificationsQuery(
      userObjectId,
      scope,
      AudienceType.User,
    );

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'notificationreadreceipts',
          let: { notificationId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$notificationId', '$$notificationId'] },
                    { $eq: ['$userId', new Types.ObjectId(userId)] },
                  ],
                },
              },
            },
          ],
          as: 'readReceipts',
        },
      },
      {
        $addFields: {
          isRead: { $gt: [{ $size: '$readReceipts' }, 0] },
        },
      },
      {
        $project: {
          readReceipts: 0,
        },
      },
    ];
    const notificationsWithRead =
      await this.notificationModel.aggregate(pipeline);

    return notificationsWithRead;
  }

  /**
   * Get notifications for a campus admin (all notifications for their campus, including global campus notifications)
   * @param user - The authenticated user object
   * @param queryDto - QueryCampusNotificationDto (pagination, scope, read_status)
   */
  async getCampusNotifications(
    user: AuthenticatedRequest['user'],
    queryDto: QueryCampusNotificationDto,
  ) {
    // Check if user is a campus admin
    if (
      !user ||
      user.user_type !== UserNS.UserType.Campus_Admin ||
      !user.campus_id
    ) {
      throw new ForbiddenException(
        'Only campus admins can access campus notifications',
      );
    }
    const { limit, sortBy, sortOrder, skip, read_status, scope } = queryDto;

    const campusId = user.campus_id;
    const campusObjectId = new Types.ObjectId(campusId);
    const match = this.getSharedNotificationsQuery(
      campusObjectId,
      scope,
      AudienceType.Campus,
    );
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
