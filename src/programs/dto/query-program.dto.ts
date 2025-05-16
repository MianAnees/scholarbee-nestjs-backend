import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { LastDegreeLevelEnum } from 'src/student-scholarships/schemas/student-scholarship.schema';

// export enum DegreeLevelEnum {
//     BACHELORS = 'Bachelors',
//     MASTERS = 'Masters',
//     PHD = 'PhD',
// }

export class QueryProgramDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @IsString()
  mode_of_study?: string;

  @IsOptional()
  @IsString()
  university_id?: string;

  @IsOptional()
  @IsString()
  campus_id?: string;

  /** This will be used to filter based on multiple campus_id fields */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  campus_ids?: string[];

  @IsOptional()
  @IsString()
  degree_level?: LastDegreeLevelEnum;

  @IsOptional()
  @IsString()
  academic_departments?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  populate?: boolean = true;
}
