import { IsBoolean, IsNotEmpty, IsObject, IsString } from 'class-validator';

export class NationalIdCardDto {
    @IsNotEmpty()
    @IsString()
    front_side: string;

    @IsNotEmpty()
    @IsString()
    back_side: string;
}

export class CreateNationalIdCardDto {
    // isProfileCompleted
    @IsNotEmpty()
    @IsBoolean()
    isProfileCompleted: boolean;

    // national_id_card
    @IsNotEmpty()
    @IsObject()
    national_id_card: NationalIdCardDto;
} 