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

export enum UserTypeEnum {
  STUDENT = 'student',
  ADMIN = 'admin',
  CAMPUS_ADMIN = 'campus_admin',
}

// TODO: Should be mapped to the schema model names
export enum SearchResourceEnum {  
  PROGRAM = 'program',
  UNIVERSITY = 'university',
  CAMPUS = 'campus',
}

interface ISearchHistoryData {
  university_name: string;
  program_name: string;
  degree_level: LastDegreeLevelEnum; // TODO: Create a main "degree level" enum and use it here
  major: string; // TODO: Create a main "major" enum, restrict the data entry to only the values in the enum and then use it here
  university_id: string;
  program_id: string;
  mode_of_study: string;
}
export interface ISearchHistory {
  timestamp: Date;
  resource_type: SearchResourceEnum;
  user_type: UserTypeEnum;
  user_id: string;
  data: Partial<ISearchHistoryData>;
}

