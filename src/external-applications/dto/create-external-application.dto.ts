import { IsNotEmpty, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { ToObjectId } from 'src/common/transformers/object-id.transformer';
import { IsObjectId } from 'src/common/validators/object-id.validator';

export class CreateExternalApplicationDto {
  @IsNotEmpty() // required
  @IsObjectId()
  @ToObjectId()
  admission_program: Types.ObjectId;

  @IsNotEmpty() // required
  @IsObjectId()
  @ToObjectId()
  campus: Types.ObjectId;

  @IsNotEmpty() // required
  @IsObjectId()
  @ToObjectId()
  program: Types.ObjectId;

  @IsOptional()
  @IsObjectId()
  @ToObjectId()
  admission: Types.ObjectId;
}
