import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserNS } from 'src/users/schemas/user.schema';

export class SignupDto {
  @IsNotEmpty()
  @IsString()
  first_name: string;

  @IsNotEmpty()
  @IsString()
  last_name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsNotEmpty()
  @IsEnum([
    UserNS.UserType.Admin,
    UserNS.UserType.Student,
    UserNS.UserType.Campus_Admin,
  ])
  user_type: UserNS.UserType;

  @IsOptional()
  @IsString()
  campus_id?: string;
} 