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

export interface SearchEventData {
  major?: string;
  degree_level?: string;
  university_id?: string;
  filters?: Record<string, any>;
  results_count?: number;
  selected_results?: string[];
}

export interface SignupEventData {
  source?: string;
  referral_code?: string;
  marketing_channel?: string;
}

export interface ApplicationStartEventData {
  program_id: string;
  university_id: string;
  major?: string;
  degree_level?: string;
} 