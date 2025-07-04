import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateEducationalBackgroundDto } from './create-educational-bg.dto';

export class UpdateEducationalBackgroundDto extends PartialType(
  CreateEducationalBackgroundDto,
) {}
