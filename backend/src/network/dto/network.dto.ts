import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

export class UpsertShelterDto {
    @IsString()
    @MinLength(1)
    name: string;

    @Type(() => Number)
    @IsNumber()
    lat: number;

    @Type(() => Number)
    @IsNumber()
    lon: number;

    @IsOptional()
    @IsString()
    powerSource?: string;

    @IsOptional()
    @IsArray()
    bands?: string[];

    @IsOptional()
    @IsString()
    status?: string;
}

export class LearnDto {
    @IsOptional()
    @IsString()
    shelterName?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    samples?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    n?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    hrLow?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    hrHigh?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    spo2Low?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    tempLow?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    tempHigh?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    fallHigh?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    bpLow?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    bpHigh?: number;

    @IsOptional()
    @IsObject()
    weights?: Record<string, number>;
}
