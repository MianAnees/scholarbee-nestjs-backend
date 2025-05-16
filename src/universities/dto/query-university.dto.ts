import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class QueryUniversityDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;
}
