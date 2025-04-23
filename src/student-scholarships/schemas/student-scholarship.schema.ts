import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';


/* 
// ? Example document present in database
{
  "_id": {
    "$oid": "67d287485dcd9decfd0e2db5"
  },
  "student_id": "67d12e785dcd9decfd0dcb03",
  "student_snapshot": {
    "name": "Alo Admin",
    "father_name": "Alii",
    "father_status": "alive",
    "domicile": "khyber_pakhtunkhwa"
  },
  "scholarship_id": "67d264a15dcd9decfd0e0c90",
  "personal_statement": "gfhgkjl",
  "reference_1": "2323",
  "reference_2": "5456576",

  ******
  "last_degree_percentage": 43,
  
  "approval_status": "Applied",
  "monthly_household_income": 50,

  ****
  
  "created_at": {
    "$date": "2025-03-13T07:20:39.660Z"
  },
  "createdBy": "67d12e785dcd9decfd0dcb03",
  "createdAt": {
    "$date": "2025-03-13T07:20:40.071Z"
  },
  "updatedAt": {
    "$date": "2025-03-13T07:20:40.071Z"
  },
  "__v": 0
}
 */


export enum FatherLivingStatusEnum {
  Alive = 'alive',
  Deceased = 'deceased',
}

export enum LastDegreeLevelEnum {
  Matriculation = 'Matriculation',
  IntermediateFScFA = 'Intermediate/FSc/FA',
  Bachelors = 'Bachelors',
  Masters = 'Masters',
  PhD = 'PhD',
}


export enum RequiredDocumentTitleEnum {
  passport = 'passport',
  national_id = 'national_id',
  birth_certificate = 'birth_certificate',
  academic_transcripts = 'academic_transcripts',
  recommendation_letter = 'recommendation_letter',
  personal_statement = 'personal_statement',
  financial_statements = 'financial_statements',
  english_proficiency_certificate = 'english_proficiency_certificate',
  resume_cv = 'resume_cv',
}

export enum ScholarshipApprovalStatusEnum {
  Applied = 'Applied',
  Approved = 'Approved',
  Rejected = 'Rejected',
}



interface IStudentSnapshotLastDegree {
  level: LastDegreeLevelEnum;
  percentage: number;
}

interface IStudentSnapshot {
  name: string;
  father_name: string;
  father_status: FatherLivingStatusEnum;
  domicile: string;
  monthly_household_income: number;
  last_degree: IStudentSnapshotLastDegree;
}

interface IRequiredDocument {
  document_name: RequiredDocumentTitleEnum;
  document_link: string;
}


export interface IStudentScholarship {
  student_id: Types.ObjectId;
  scholarship_id: Types.ObjectId;
  student_snapshot: IStudentSnapshot;
  application_date: Date;
  approval_status?: ScholarshipApprovalStatusEnum;
  required_documents?: IRequiredDocument[];
  personal_statement: string;
  reference_1: string;
  reference_2: string;
  created_at?: Date;
  createdBy: Types.ObjectId;
}



@Schema({ timestamps: false, _id: false })
export class RequiredDocument implements IRequiredDocument {
  @Prop({
    type: String,
    enum: RequiredDocumentTitleEnum,
    required: true,
  })
  document_name: IRequiredDocument['document_name'];

  @Prop({ type: String, required: true })
  document_link: IRequiredDocument['document_link'];
}

export const RequiredDocumentSchema = SchemaFactory.createForClass(RequiredDocument);



@Schema({ _id: false })
class StudentSnapshotDto implements IStudentSnapshot {
  @Prop({ type: String, required: true })
  name: IStudentSnapshot['name'];

  @Prop({ type: String, required: true })
  father_name: IStudentSnapshot['father_name'];

  @Prop({ type: String, enum: FatherLivingStatusEnum, required: true })
  father_status: IStudentSnapshot['father_status'];

  @Prop({ type: String, required: true })
  domicile: IStudentSnapshot['domicile'];

  @Prop({ type: Number, required: true })
  monthly_household_income: IStudentSnapshot['monthly_household_income'];

  // last_degree object with level and percentage
  @Prop({
    type: {
      level: { type: String, enum: LastDegreeLevelEnum, required: true },
      percentage: { type: Number, required: true },
    }
  })
  last_degree: IStudentSnapshot['last_degree']
}

const StudentSnapshotSchema = SchemaFactory.createForClass(StudentSnapshotDto);




@Schema({ timestamps: false, collection: 'student_scholarships' })
export class StudentScholarship implements IStudentScholarship {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  student_id: IStudentScholarship['student_id'];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Scholarship', required: true })
  scholarship_id: IStudentScholarship['scholarship_id'];

  @Prop({ type: StudentSnapshotSchema, default: {}, required: true })
  student_snapshot: IStudentScholarship['student_snapshot'];

  @Prop({ type: Date, required: true })
  application_date: IStudentScholarship['application_date'];

  @Prop({
    type: String,
    enum: ScholarshipApprovalStatusEnum,
    default: ScholarshipApprovalStatusEnum.Applied
  })
  approval_status?: IStudentScholarship['approval_status'];


  @Prop({ type: String, required: true })
  personal_statement: IStudentScholarship['personal_statement'];

  @Prop({ type: String, required: true })
  reference_1: IStudentScholarship['reference_1'];

  @Prop({ type: String, required: true })
  reference_2: IStudentScholarship['reference_2'];

  @Prop({ type: [RequiredDocumentSchema], default: [], required:false,/* , min:1 */ })
  required_documents?: IStudentScholarship['required_documents'];

  @Prop({ type: Date, default: Date.now })
  created_at?: IStudentScholarship['created_at'];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: IStudentScholarship['createdBy'];
}

export type StudentScholarshipDocument = HydratedDocument<StudentScholarship>
export const StudentScholarshipSchema = SchemaFactory.createForClass(StudentScholarship);