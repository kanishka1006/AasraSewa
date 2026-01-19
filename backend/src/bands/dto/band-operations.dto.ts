import { IsString, IsNotEmpty, IsNumber, Min, IsEnum, IsOptional } from 'class-validator';

export class AssignBandDto {
    @IsString()
    @IsNotEmpty()
    userPhoneNumber: string;

    @IsString()
    @IsNotEmpty()
    macAddress: string;

    @IsNumber()
    @Min(0)
    depositAmount: number;
}

export enum ReturnCondition {
    GOOD = 'GOOD',
    DAMAGED = 'DAMAGED',
    LOST = 'LOST',
}

export class ReturnBandDto {
    @IsString()
    @IsNotEmpty()
    macAddress: string;

    @IsEnum(ReturnCondition)
    condition: ReturnCondition;
}

export class UpdateBandStatusDto {
    @IsString()
    status: string; // Should match BandStatus enum
}
