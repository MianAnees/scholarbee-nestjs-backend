import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateFeeDto {
    @IsString()
    program_id: string;

    @IsNumber()
    tuition_fee: number;

    @IsOptional()
    @IsNumber()
    application_fee?: number;

    @IsOptional()
    @IsString()
    other_fees?: string;

    @IsOptional()
    @IsString()
    payment_schedule?: string;
} 