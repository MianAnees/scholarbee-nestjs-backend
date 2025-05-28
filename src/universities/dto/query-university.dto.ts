import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AdmissionStatusEnum } from 'src/admissions/schemas/admission.schema';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class QueryUniversityDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;

  // an enum query parameter to get the universities according to the status of the programs i.e. "available" or "unavailable" or "open" (available and not past admission deadline) or "closed" (available but past admission deadline)
  @IsOptional()
  @IsEnum(AdmissionStatusEnum)
  admission_status?: AdmissionStatusEnum ;
}
