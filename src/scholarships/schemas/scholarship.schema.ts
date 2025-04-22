import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type StudentScholarshipDocument = HydratedDocument<StudentScholarship>

interface StudentSnapshot {
    name?: string;
    father_name?: string;
    father_status?: string;
    domicile?: string;
    monthly_household_income?: number;
    last_degree?: {
        level?: string;
        percentage?: number;
    };
}

// required documents enum
enum RequiredDocumentTitle {
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

enum ScholarshipApprovalStatus {
    Applied = 'Applied',
    Approved = 'Approved',
    Rejected = 'Rejected',
}

enum LastDegreeType {
    Matriculation = 'Matriculation',
    IntermediateFScFA = 'Intermediate/FSc/FA',
    Bachelors = 'Bachelors',
    Masters = 'Masters',
    PhD = 'PhD',
}


interface RequiredDocument {
    document_name?: RequiredDocumentTitle;
    document_link?: string;
}

@Schema({ timestamps: false, collection: 'student_scholarships' })
export class StudentScholarship {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
    student_id?: MongooseSchema.Types.ObjectId;

    // How to refactor this?
    @Prop({
        type: {
            // REVIEW: Is the default behavior to make the property required?
            name: { type: String },
            father_name: { type: String },
            father_status: { type: String },
            domicile: { type: String },
            monthly_household_income: { type: Number },
            last_degree: { 
                level: {
                    type: String,
                    enum: LastDegreeType,
                    required: false,
                },
                percentage: { type: Number, required: false },
            },
        },
        default: {},
    })
    student_snapshot?: StudentSnapshot;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Scholarship', required: false })
    scholarship_id?: MongooseSchema.Types.ObjectId;

    @Prop({ type: Date, required: false })
    application_date?: Date;

    @Prop({
        type: String,
        enum: ScholarshipApprovalStatus,
        required: false
    })
    approval_status?: ScholarshipApprovalStatus; 


    @Prop({ type: String, required: false })
    personal_statement?: string;

    @Prop({ type: String, required: false })
    reference_1?: string;

    @Prop({ type: String, required: false })
    reference_2?: string;

    @Prop({
        type: [
            {
                document_name: {
                    type: String,
                    enum: Object.values(RequiredDocumentTitle),
                    required: false,
                },
                document_link: { type: String, required: false },
            },
        ],
        default: [],
    })
    required_documents?: RequiredDocument[]; 

    @Prop({ type: Date, default: Date.now })
    created_at?: Date;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
    createdBy?: MongooseSchema.Types.ObjectId;
}

export const StudentScholarshipSchema = SchemaFactory.createForClass(StudentScholarship);
