import { IsNotEmpty, IsObject, IsOptional, IsString, IsUrl } from 'class-validator';

export class MarksGPADto {
    @IsNotEmpty()
    @IsString()
    total_marks_gpa: string;

    @IsNotEmpty()
    @IsString()
    obtained_marks_gpa: string;
}

export class CreateEducationalBackgroundDto {
    // REVIEW: This should not be received from the client but the type of educational background should allow the server to generate the id and attach it to the educational background
    // id - should be a unique identifier for the educational background
    @IsOptional()
    @IsString()
    id: string;

    // education_level
    @IsNotEmpty()
    @IsString()
    education_level: string;

    // school_college_university
    @IsNotEmpty()
    @IsString()
    school_college_university: string;

    // field_of_study
    @IsNotEmpty()
    @IsString()
    field_of_study: string;

    // marks_gpa
    @IsNotEmpty()
    @IsObject()
    marks_gpa: MarksGPADto;

    // year_of_passing
    @IsNotEmpty()
    @IsString()
    year_of_passing: string;

    // board
    @IsNotEmpty()
    @IsString()
    board: string;

    // transcript - should be a url
    @IsNotEmpty()
    @IsString()
    @IsUrl({ require_protocol: true })
    transcript: string;
}