import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
} from '../schemas/notification.schema';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import {
  AccessTokenPayload,
  AuthenticatedRequest,
} from 'src/auth/types/auth.interface';
import { UserNS } from 'src/users/schemas/user.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  // Creates a new notification for a user
  async createNotification(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const notification = new this.notificationModel(createNotificationDto);
    return notification.save();
  }

  private async getUnreadUserGlobalNotifications(): Promise<Notification[]> {
    /* 
    - Query Notification collection where:
    - audience.audienceType == 'user'
    - audience.isGlobal == true
- For each notification:
    - Check if recipients array contains an entry for userId with isRead == false
    - OR (if no recipients array, treat as unread for all users)
- Return list of matching notifications
     */
    return [];
  }
  private async getUnreadUserSpecificNotifications(
    userId: string,
  ): Promise<Notification[]> {
    /* 
    - Query Notification collection where:
    - audience.audienceType == 'user'
    - audience.isGlobal == false
    - audience.recipients contains an entry with:
        - recipientId == userId
        - isRead == false
    - Return list of matching notifications
     */
    return [];
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

    if (user.user_type == UserNS.UserType.Student) {
      const globalNotifications = await this.getUnreadUserGlobalNotifications();
      const specificNotifications =
        await this.getUnreadUserSpecificNotifications(user._id);
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
}
