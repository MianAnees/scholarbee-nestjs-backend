import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

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

  // education_level - REQUIRED
  @IsNotEmpty()
  @IsString()
  education_level: string;

  // school_college_university - OPTIONAL
  @IsOptional()
  @IsString()
  school_college_university?: string;

  // field_of_study - OPTIONAL
  @IsOptional()
  @IsString()
  field_of_study?: string;

  // marks_gpa - REQUIRED
  @IsNotEmpty()
  @IsObject()
  marks_gpa: MarksGPADto;

  // year_of_passing - OPTIONAL
  @IsOptional()
  @IsString()
  year_of_passing?: string;

  // board - OPTIONAL
  @IsOptional()
  @IsString()
  board?: string;

  // transcript - OPTIONAL
  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true })
  transcript?: string;
}
