import { Expose, Type, Exclude } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @Exclude()
  @Expose()
  get skip(): number {
    if (
      typeof this.page === 'number' &&
      typeof this.limit === 'number' &&
      this.page > 0 &&
      this.limit > 0
    ) {
      return (this.page - 1) * this.limit;
    }
    return 0;
  }

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
