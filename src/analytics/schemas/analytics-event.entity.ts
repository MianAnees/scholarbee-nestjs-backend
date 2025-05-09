import { LastDegreeLevelEnum } from "src/student-scholarships/schemas/student-scholarship.schema";

export enum UserEventType {
  SEARCH = 'search',
  SIGNUP = 'signup',
  APPLICATION_START = 'application-start',
}

export interface UserEvent {
  timestamp: Date;
  studentId?: string;
  eventType: UserEventType;
  eventData: Record<string, any>;
}