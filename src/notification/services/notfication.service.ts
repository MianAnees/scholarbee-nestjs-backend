import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, RootFilterQuery } from 'mongoose';
import { AuthenticatedRequest } from 'src/auth/types/auth.interface';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UserNS } from 'src/users/schemas/user.schema';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';
import {
  NotificationQuery,
  QueryNotificationDto,
} from '../dto/query-notification.dto';

// ! Temporary DTO for getting notifications
export class GetNotificationDto extends PaginationDto {
  user_id: string;
  campus_id: string;
  university_id: string;
}

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
  ): Promise<Notification> {
    try {
      const notification = new this.notificationModel(createNotificationDto);
      return notification.save();
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  private getUnreadUserGlobalNotificationsQuery(
    query: RootFilterQuery<NotificationDocument>,
  ): RootFilterQuery<NotificationDocument> {
    return {
      ...query,
      audience: {
        // ...query.audience,
        audienceType: 'user',
        isGlobal: true,
      },
    };
  }

  private getUnreadUserSpecificNotificationsQuery(
    query: RootFilterQuery<NotificationDocument>,
    userId: string,
  ): RootFilterQuery<NotificationDocument> {
    return {
      audience: {
        audienceType: 'user',
        isGlobal: false, // gets the non-global notifications
        recipients: {
          $elemMatch: { id: userId, isRead: false },
        },
      },
    };
  }
  private async getUnreadCampusGlobalNotifications(): Promise<Notification[]> {
    /* 
    - Query Notification collection where:
    - audience.audienceType == 'campus'
    - audience.isGlobal == true
    - For each notification:
        - Check if recipients array contains an entry for campusId with isRead == false
        - OR (if no recipients array, treat as unread for all campuses)
    - Return list of matching notifications
     */
    return [];
  }
  private async getUnreadCampusSpecificNotifications(
    campusId: string,
  ): Promise<Notification[]> {
    /* 
    - Query Notification collection where:
    - audience.audienceType == 'campus'
    - audience.isGlobal == false
    - audience.recipients contains an entry with:
        - recipientId == campusId
        - isRead == false
    - Return list of matching notifications
     */
    return [];
  }
  private async getUnreadUniversityGlobalNotifications(): Promise<
    Notification[]
  > {
    /* 
    - Query Notification collection where:
    - audience.audienceType == 'university'
    - audience.isGlobal == true
    - For each notification:
        - Check if recipients array contains an entry for universityId with isRead == false
        - OR (if no recipients array, treat as unread for all universities)
    - Return list of matching notifications
    
     */
    return [];
  }
  private async getUnreadUniversitySpecificNotifications(
    universityId: string,
  ): Promise<Notification[]> {
    /* 
    - Query Notification collection where:
    - audience.audienceType == 'university'
    - audience.isGlobal == false
    - audience.recipients contains an entry with:
        - recipientId == universityId
        - isRead == false
    - Return list of matching notifications
    
     */
    return [];
  }

  // receive unread notifications
  /**
   * User asks for the unread notifications. We send him the notifications where
   * * scope: [user/global] and isRead: false
   * * scope: [user/req-user-id] and isRead: false
   * * if user is a campus_admin,
   * * * scope: [campus/global] and isRead: false
   * * * campus id of the user is matched with the scope: [campus/campus-id]
   * * if user is a university_admin,
   * * * scope: [university/global] and isRead: false
   * * * university id of the user is matched with the scope: [university/university-id]
   */
  async getUnreadNotifications(user: AuthenticatedRequest['user']) {
    let notifications: Notification[] = [];
    let query: RootFilterQuery<NotificationDocument> = {};

    if (user.user_type == UserNS.UserType.Student) {
      const globalNotifications =
        await this.getUnreadUserGlobalNotificationsQuery(query);

      const specificNotifications =
        await this.getUnreadUserSpecificNotificationsQuery(query, user._id);

      notifications.push(...globalNotifications, ...specificNotifications);
    }

    if (user.user_type == UserNS.UserType.Admin) {
      const campusGlobalNotifications =
        await this.getUnreadCampusGlobalNotifications();
      const campusSpecificNotifications =
        await this.getUnreadCampusSpecificNotifications(user.campus_id);

      // TODO: REVIEW: is university_admin or campus_admin a valid user type?
      const universityGlobalNotifications =
        await this.getUnreadUniversityGlobalNotifications();
      const universitySpecificNotifications =
        await this.getUnreadUniversitySpecificNotifications(user.university_id);

      notifications.push(
        // Campus notifications
        ...campusGlobalNotifications,
        ...campusSpecificNotifications,
        // University notifications
        ...universityGlobalNotifications,
        ...universitySpecificNotifications,
      );
    }

    return notifications;
  }

  async getUnreadUserNotifications(user: AuthenticatedRequest['user']) {
    let query: RootFilterQuery<NotificationDocument> = {};
    // let notifications: Notification[] = [];

    const globalUserNotificationsQuery =
      await this.getUnreadUserGlobalNotificationsQuery(query);

    const getSpecificNotificationsQuery =
      await this.getUnreadUserSpecificNotificationsQuery(query, user._id);

    const specificNotifications = await this.notificationModel.find(
      getSpecificNotificationsQuery,
    );

    const notifications = [
      ...globalUserNotificationsQuery,
      ...specificNotifications,
    ];

    return notifications;
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
