import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { LivingStatusEnum } from 'src/common/constants/shared.constants';
import {
  EducationalBackground,
  NationalIdCard,
  UserNS,
} from '../../users/schemas/user.schema';

export type ApplicationDocument = Application & Document;

interface IApplicantSnapshot {
  first_name: string;
  last_name?: string;
  email: string;
  phone_number: string;
  date_of_birth?: Date;
  gender?: string;
  nationality?: string;
  cnic?: string;
  profile_image_url?: string;
  city?: string;
  stateOrProvince?: string;
  streetAddress?: string;
  postalCode?: string;
  districtOfDomicile?: string;
  provinceOfDomicile?: string;
  father_name?: string;
  father_status?: string;
  father_profession?: string;
  father_income?: string;
  religion?: string;
  special_person?: string;
  educational_backgrounds: EducationalBackground[];
  national_id_card: NationalIdCard;
  user_type: string;
}

@Schema({
  timestamps: false,
  _id: false,
})
export class ApplicantSnapshot implements IApplicantSnapshot /* Optional */ {
  @Prop({ required: true })
  first_name: string;

  @Prop({ required: false })
  last_name?: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone_number: string;

  @Prop({ required: false })
  date_of_birth?: Date;

  @Prop({ required: false })
  father_name?: string;

  @Prop({ required: false })
  father_profession?: string;

  @Prop({
    type: String,
    enum: LivingStatusEnum,
    required: false,
  })
  father_status?: LivingStatusEnum;

  @Prop({ required: false })
  father_income?: string;

  @Prop({ required: false })
  mother_name?: string;

  @Prop({ required: false })
  mother_profession?: string;

  @Prop({ enum: ['alive', 'deceased'], required: false })
  mother_status?: string;

  @Prop({ required: false })
  mother_income?: string;

  @Prop({ required: false })
  religion?: string;

  @Prop({ enum: ['yes', 'no'], required: false })
  special_person?: string;

  @Prop({ enum: ['Male', 'Female', 'Other'], required: false })
  gender?: string;

  @Prop({ required: false })
  nationality?: string;

  @Prop({
    enum: ['khyber_pakhtunkhwa', 'punjab', 'sindh', 'balochistan'],
    required: false,
  })
  provinceOfDomicile?: string;

  @Prop({ required: false })
  districtOfDomicile?: string;

  @Prop({ required: false })
  stateOrProvince?: string;

  @Prop({ required: false })
  city?: string;

  @Prop({ required: false })
  postalCode?: string;

  @Prop({ required: false })
  streetAddress?: string;

  @Prop({ required: false })
  profile_image_url?: string;

  @Prop({ required: true, enum: UserNS.UserType })
  user_type: UserNS.UserType;

  @Prop({ type: [EducationalBackground], default: [] })
  educational_backgrounds: EducationalBackground[];

  @Prop({ type: NationalIdCard, required: true })
  national_id_card: NationalIdCard;
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

  @Prop({ type: Types.ObjectId, ref: 'Program', required: true })
  program_id: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Admission',
    required: true,
  })
  admission_id: Types.ObjectId;

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

  @Prop({ type: ApplicantSnapshot, required: false })
  applicant_snapshot?: ApplicantSnapshot;

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
