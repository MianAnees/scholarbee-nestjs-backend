import { IsNotEmpty, IsString, IsOptional, IsArray, Validate } from 'class-validator';
import { IsValidObjectId } from '../../common/validators/object-id.validator';

export class CreateMessageDto {
    @IsNotEmpty()
    @IsString()
    @Validate(IsValidObjectId, { message: 'Conversation ID must be a valid MongoDB ObjectId' })
    conversation_id: string;

    @IsNotEmpty()
    @IsString()
    content: string;

    @IsOptional()
    @IsArray()
    attachments?: string[];
} 