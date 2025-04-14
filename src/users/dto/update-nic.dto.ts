import { PartialType } from '@nestjs/mapped-types';
import { NationalIdCardDto } from 'src/users/dto/create-nic.dto';

export class UpdateNationalIdCardDto extends PartialType(NationalIdCardDto) { } 