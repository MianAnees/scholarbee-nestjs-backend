import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { EsEntity, EsField } from 'es-mapping-ts';
import { BaseMappingEntity } from 'src/elasticsearch/mappings/base.mapping';

export type ApplicationDocument = Application & Document;

// Define nested interfaces for complex types
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

interface Preference {
  id: string;
  program: string;
  preference_order: string;
}

interface Department {
  id: string;
  department: string;
  preferences: Preference[];
}

export enum ApplicationStatus {
  /**
   * Draft status is used to indicate that the application is in draft mode and is (created but) not submitted by the user
   */
  DRAFT = 'Draft',

  /**
   * Pending status is used to indicate that the application is submitted by the user and is pending for approval
   */
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  UNDER_REVIEW = 'Under Review',
}

@Schema({ timestamps: true })
export class Application {
  @Prop({ type: String, ref: 'User', required: true })
  student_id: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Program', required: true })
  program_id: MongooseSchema.Types.ObjectId;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Admission',
    required: true,
  })
  admission_id: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, ref: 'User', required: true })
  applicant: string;

  @Prop({ type: String, ref: 'AdmissionProgram', required: true })
  admission_program_id: string;

  @Prop({ type: String, ref: 'Campus', required: true })
  campus_id: string;

  @Prop({ type: String, ref: 'Program', required: true })
  program: string;

  @Prop({ type: Date, required: true })
  submission_date: Date;

  @Prop({
    type: String,
    enum: ApplicationStatus,
    default: ApplicationStatus.DRAFT,
  })
  status: ApplicationStatus;

  @Prop({ type: Number, required: true })
  total_processing_fee: number;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  applicant_snapshot: ApplicantSnapshot;

  //   An array of legal document ids that the applicant has accepted
  //   Ref: LegalDocument
  @Prop({
    type: [Types.ObjectId],
    default: [],
    required: false,
    ref: 'LegalDocument',
  })
  accepted_legal_documents?: Types.ObjectId[];

  @Prop({
    type: [
      {
        id: String,
        department: String,
        preferences: [
          {
            id: String,
            program: String,
            preference_order: String,
          },
        ],
      },
    ],
  })
  departments: Department[];
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
