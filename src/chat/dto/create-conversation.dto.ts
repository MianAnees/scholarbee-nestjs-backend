import { IsNotEmpty, IsString, IsOptional, Validate } from 'class-validator';
import { IsValidObjectId } from '../../common/validators/object-id.validator';

export class CreateConversationDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsNotEmpty()
    @IsString()
    @Validate(IsValidObjectId, { message: 'Campus ID must be a valid MongoDB ObjectId' })
    campus_id: string;

    @IsOptional()
    @IsString()
    type?: string;
} 