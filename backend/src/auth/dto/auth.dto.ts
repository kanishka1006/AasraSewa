import { IsString, IsNotEmpty, IsPhoneNumber, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    fullName: string;

    @IsPhoneNumber('IN')
    phoneNumber: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsString()
    @IsOptional()
    deviceToken?: string;
}

export class LoginDto {
    @IsPhoneNumber('IN')
    phoneNumber: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
