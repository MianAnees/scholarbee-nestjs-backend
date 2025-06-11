import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ExternalApplicationDocument = ExternalApplication & Document;

// Define nested interfaces for complex types (reused from application schema)
interface EducationalBackground {
  id: string;
  education_level: string;
  field_of_study: string;
  school_college_university: string;
  board: string;
  year_of_passing: string;
  marks_gpa: {
    obtained_marks_gpa: string;
    total_marks_gpa: string;
  };
  transcript: string;
}

interface NationalIdCard {
  front_side: string;
  back_side: string;
}

interface ApplicantSnapshot {
  first_name: string;
  last_name?: string;
  email: string;
  phone_number: string;
  date_of_birth: Date;
  gender?: string;
  nationality: string;
  cnic?: string;
  profile_image_url: string;
  city: string;
  stateOrProvince: string;
  streetAddress: string;
  postalCode: string;
  districtOfDomicile: string;
  provinceOfDomicile: string;
  father_name: string;
  father_status?: string;
  father_profession?: string;
  father_income?: string;
  religion?: string;
  special_person?: string;
  educational_backgrounds: EducationalBackground[];
  national_id_card: NationalIdCard;
  user_type: string;
}

export enum ExternalApplicationStatus {
  /**
   * Draft status is used to indicate that the external application is in draft mode and is (created but) not submitted by the user
   */
  DRAFT = 'Draft',

  /**
   * Pending status is used to indicate that the external application is submitted by the user and is pending for approval
   */
  PENDING = 'Pending',

  /**
   * Redirected status indicates that the user has been redirected to external platform
   */
  REDIRECTED = 'Redirected',

  /**
   * Completed status indicates that the external application process has been completed
   */
  COMPLETED = 'Completed',

  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  UNDER_REVIEW = 'Under Review',
}

@Schema({ timestamps: true })
export class ExternalApplication {
  @Prop({ type: Types.ObjectId, ref: 'Program', required: true })
  program: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Admission',
    required: true,
  })
  admission: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  applicant: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'AdmissionProgram', required: true })
  admission_program: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Campus', required: true })
  campus: Types.ObjectId;

  @Prop({ type: Object, required: true })
  applicant_snapshot: ApplicantSnapshot;
}

export const ExternalApplicationSchema =
  SchemaFactory.createForClass(ExternalApplication);
