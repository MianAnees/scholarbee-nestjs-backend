import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { StudentScholarshipApprovalStatus } from '../schemas/student-scholarship.schema';
import { Type } from 'class-transformer';


/* 
// payload from the client
{
    "student_id": "67e1150ac1224a00af2fa3f1",
    "scholarship_id": "67ff8e035652e4394871f1c6",
    "reference_1": "asdasd",
    "reference_2": "1100",
    "personal_statement": "asdfghj",
    "student_snapshot": {
        "name": "Muhammad",
        "domicile": "bahawalpur",
        "father_name": "Arsalan",
        "father_status": "alive"
    },
    "last_degree_percentage": "44",
    "last_degree_type": "Intermediate/FSc/FA",
    "monthly_household_income": "50k-100k"
    "approval_status": "Applied",
}
 */

export class CreateStudentScholarshipDto {
    @IsMongoId()
    @IsNotEmpty()
    student_id: string;

    @IsMongoId()
    @IsNotEmpty()
    scholarship_id: string;

    @IsString()
    @IsOptional()
    reference_1?: string;

    @IsString()
    @IsOptional()
    reference_2?: string;

    @IsString()
    @IsOptional()
    personal_statement?: string;

    @IsNotEmpty()
    student_snapshot: {
        name: string;
        father_name: string;
        father_status: string;
        domicile: string;
    };

    @IsNumber()
    @IsOptional()
    // @Type(() => Number) // REVIEW: 
    last_degree_percentage?: number;

    @IsString()
    @IsOptional()
    last_degree_type?: string;

    @IsString()
    @IsOptional()
    monthly_household_income?: string;

    // Use the schema properties here?
    @IsEnum(StudentScholarshipApprovalStatus)
    @IsOptional()
    approval_status?: StudentScholarshipApprovalStatus = StudentScholarshipApprovalStatus.APPLIED;
} 