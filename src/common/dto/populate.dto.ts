import { IsOptional } from 'class-validator';
import { IsValidBoolean } from 'src/auth/decorators/is-valid-boolean.decorator';

export class PopulateDto {
  @IsOptional()
  @IsValidBoolean()
  populate?: boolean;
}
