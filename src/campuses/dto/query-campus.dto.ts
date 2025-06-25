import { IsOptional, IsString, IsEnum } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AdmissionStatusEnum } from '../../admissions/schemas/admission.schema';

export class QueryCampusDto extends PaginationDto {
  @IsOptional()
  @IsString()
  name?: string;

  // an enum query parameter to get the campuses according to the status of the programs i.e. "available" or "unavailable"
  @IsOptional()
  @IsEnum(AdmissionStatusEnum)
  admission_program_status?: AdmissionStatusEnum;
}
