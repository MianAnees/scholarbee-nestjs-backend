import { IsOptional, IsString } from 'class-validator';

export class QueryAdmissionProgramDegreeLevelsDto {
  @IsOptional()
  @IsString()
  university_id?: string;
} 