import { IsArray, IsNotEmpty, ArrayMinSize, IsMongoId } from 'class-validator';

export class CompareProgramsDto {
    @IsArray()
    @IsNotEmpty()
    @ArrayMinSize(1)
    @IsMongoId({ each: true })
    programIds: string[];
} 