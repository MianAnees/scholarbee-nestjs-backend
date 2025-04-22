
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';


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


export type StudentScholarshipDocument = HydratedDocument<StudentScholarship>


enum LastDegreeTypeEnum {
    Matriculation = 'Matriculation',
    IntermediateFScFA = 'Intermediate/FSc/FA',
    Bachelors = 'Bachelors',
    Masters = 'Masters',
    PhD = 'PhD',
}


enum IRequiredDocumentTitle {
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

enum ScholarshipApprovalStatusEnum {
    Applied = 'Applied',
    Approved = 'Approved',
    Rejected = 'Rejected',
}



interface IStudentSnapshotLastDegree {
    level?: LastDegreeTypeEnum;
    percentage?: number;
}

interface IStudentSnapshot {
    name?: string;
    father_name?: string;
    father_status?: string;
    domicile?: string;
    monthly_household_income?: number;
    last_degree?: IStudentSnapshotLastDegree;
}

interface IRequiredDocument {
    document_name?: IRequiredDocumentTitle;
    document_link?: string;
}


@Schema({ _id: false })
export class RequiredDocument implements IRequiredDocument {
  @Prop({
    type: String,
    enum: IRequiredDocumentTitle,
    required: false,
  })
  document_name?: IRequiredDocumentTitle;

  @Prop({ type: String, required: false })
  document_link?: string;
}

export const RequiredDocumentSchema = SchemaFactory.createForClass(RequiredDocument);



@Schema({ _id: false })
class StudentSnapshot implements IStudentSnapshot {
    @Prop({ type: String, required: false })
    name?: string;

    @Prop({ type: String, required: false })
    father_name?: string;

    @Prop({ type: String, required: false })
    father_status?: string;

    @Prop({ type: String, required: false })
    domicile?: string;

    @Prop({ type: Number, required: false })
    monthly_household_income?: number;

    // last_degree object with level and percentage
    @Prop({
        type: {
            level: { type: String, enum: LastDegreeTypeEnum, required: false },
            percentage: { type: Number, required: false },
        },
        required: false
    })
    last_degree?: IStudentSnapshotLastDegree
}

export const StudentSnapshotSchema = SchemaFactory.createForClass(StudentSnapshot);




@Schema({ timestamps: false, collection: 'student_scholarships' })
export class StudentScholarship {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
    student_id?: MongooseSchema.Types.ObjectId;


    @Prop({ type: StudentSnapshotSchema, default: {}, required: true })
    student_snapshot?: StudentSnapshot;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Scholarship', required: false })
    scholarship_id?: MongooseSchema.Types.ObjectId;

    @Prop({ type: Date, required: false })
    application_date?: Date;

    @Prop({
        type: String,
        enum: ScholarshipApprovalStatusEnum,
        required: false
    })
    approval_status?: ScholarshipApprovalStatusEnum;


    @Prop({ type: String, required: false })
    personal_statement?: string;

    @Prop({ type: String, required: false })
    reference_1?: string;

    @Prop({ type: String, required: false })
    reference_2?: string;

    @Prop({ type: [StudentSnapshotSchema], default: [] })
    required_documents?: RequiredDocument[];

    @Prop({ type: Date, default: Date.now })
    created_at?: Date;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
    createdBy?: MongooseSchema.Types.ObjectId;
}

export const StudentScholarshipSchema = SchemaFactory.createForClass(StudentScholarship);