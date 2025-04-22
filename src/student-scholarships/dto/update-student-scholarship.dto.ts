import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateStudentScholarshipDto, RequiredDocumentDto } from './create-student-scholarship.dto';
import { IsArray, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { IRequiredDocumentTitle, IStudentScholarship, ScholarshipApprovalStatusEnum, StudentScholarship } from '../schemas/student-scholarship.schema';
import { Type } from 'class-transformer';

// Base class for approval status
export class UpdateStudentScholarshipApprovalStatusDto {
    @IsEnum(ScholarshipApprovalStatusEnum)
    @IsOptional()
    approval_status?: ScholarshipApprovalStatusEnum = ScholarshipApprovalStatusEnum.Applied;
}


export class AddRequiredDocumentDto {
    @ValidateNested()
    document: RequiredDocumentDto;
}


export class RemoveRequiredDocumentDto {
    @IsEnum(IRequiredDocumentTitle)
    document_name: IRequiredDocumentTitle;
}

// REVIEW (low): Shouldn't OmitType be used to exclude the properties which should not be update-able
export class UpdateStudentScholarshipDto extends PartialType(CreateStudentScholarshipDto)  {
    @IsEnum(ScholarshipApprovalStatusEnum)
    @IsOptional()
    approval_status?: ScholarshipApprovalStatusEnum;
}