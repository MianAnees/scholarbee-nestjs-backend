import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, } from 'mongoose';

// Define the approval status enum
export enum StudentScholarshipApprovalStatus {
  APPLIED = 'Applied',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  PENDING = 'Pending'
}

export type StudentScholarshipDocument = StudentScholarship & Document;


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
@Schema({ timestamps: true, collection: 'student_scholarships' })
export class StudentScholarship {
    @Prop({
        type: String,
        ref: 'User',
        required: true,
        index: true
    })
    student_id: string;

    // REVIEW: Why do we keep this as a snapshot, instead of fetching it directly from the user?
    @Prop({ type: Object, required: true })
    student_snapshot: {
        name: string;
        father_name: string;
        father_status: string;
        domicile: string;
    };

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'scholarship', required: true })
    scholarship_id: MongooseSchema.Types.ObjectId;

    @Prop({ type: String, required: false })
    personal_statement?: string;

    @Prop({ type: String, required: false })
    reference_1?: string;

    @Prop({ type: String, required: false })
    reference_2?: string;

    @Prop({ type: String, required: false })
    last_degree_type?: string; // REVIEW: This is not found in the database.

    @Prop({ type: Number, required: false })
    last_degree_percentage?: number; // REVIEW: Why is this data not a part of the student profile?

    @Prop({ type: String, required: false })
    monthly_household_income?: string; // REVIEW: Why is this data not a part of the student profile?

    @Prop({ 
        type: String, 
        enum: Object.values(StudentScholarshipApprovalStatus), 
        default: StudentScholarshipApprovalStatus.APPLIED 
    })
    approval_status: StudentScholarshipApprovalStatus;

    @Prop({ type: Date, default: Date.now })
    created_at: Date;

    @Prop({ type: String, required: true })
    createdBy: string;
    
    // This is in reference to the required_documents field from Scholarship schema
    @Prop({ type: [Object], default: [] })
    required_documents: {
        id: string;
        document_name: string;
    }[];
}

export const StudentScholarshipSchema = SchemaFactory.createForClass(StudentScholarship); 