import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ParseObjectId } from 'nestjs-object-id';
import { BetterOmit } from 'src/utils/typescript.utils';
import { IRequiredDocumentTitle, IStudentScholarship, LastDegreeTypeEnum, StudentScholarship } from '../schemas/student-scholarship.schema';


// last_degree DTO
export class LastDegreeDto {
    @IsEnum(LastDegreeTypeEnum)
    level: LastDegreeTypeEnum;

    @IsNumber()
    @Type(() => Number)
    percentage: number;
}

// student_snapshot DTO
export class StudentSnapshotDto
    implements Pick<
        IStudentScholarship['student_snapshot'],
        'last_degree' | 'father_status' | 'monthly_household_income'
    > {

    @IsString()
    father_status: string;

    @IsNumber()
    @Type(() => Number)
    monthly_household_income: number;

    @ValidateNested()
    last_degree: LastDegreeDto;


}

// required_documents DTO
export class RequiredDocumentDto {
    @IsOptional()
    @IsEnum(IRequiredDocumentTitle)
    document_name?: IRequiredDocumentTitle;

    @IsOptional()
    @IsString()
    document_link?: string;
}



interface ICreateStudentScholarshipType extends BetterOmit<
    StudentScholarship,
    'created_at' | 'createdBy' | 'application_date' | 'approval_status' | 'student_snapshot'
> {
    student_snapshot: StudentSnapshotDto;
}

export class CreateStudentScholarshipDto implements ICreateStudentScholarshipType {
    @IsMongoId()
    @ParseObjectId()
    @IsNotEmpty()
    student_id: ICreateStudentScholarshipType['student_id'];

    @IsMongoId()
    @ParseObjectId()
    @IsNotEmpty()
    scholarship_id: ICreateStudentScholarshipType['scholarship_id'];

    @IsOptional()
    @IsString()
    reference_1: ICreateStudentScholarshipType['reference_1'];

    @IsOptional()
    @IsString()
    reference_2: ICreateStudentScholarshipType['reference_2'];

    @IsOptional()
    @IsString()
    personal_statement: ICreateStudentScholarshipType['personal_statement'];

    @IsNotEmpty()
    @IsObject()
    @ValidateNested()
    student_snapshot: StudentSnapshotDto;

    @IsArray()
    @ValidateNested({ each: true })
    required_documents: RequiredDocumentDto[];
}
