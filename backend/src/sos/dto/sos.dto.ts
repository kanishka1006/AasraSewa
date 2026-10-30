import { IsString, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { AlertStatus, AlertPriority } from '../../database/entities/alert.entity';

export class CreateSosDto {
    @IsMongoId()
    userId: string;

    @IsString()
    @IsOptional()
    notes?: string;

    // Ideally locations come from Telemetry, but can be passed explicitly
    @IsOptional()
    lat?: number;

    @IsOptional()
    lon?: number;
}

export class UpdateSosStatusDto {
    @IsMongoId()
    alertId: string;

    @IsEnum(AlertStatus)
    status: AlertStatus;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class AssignRescuerDto {
    @IsMongoId()
    alertId: string;

    @IsMongoId()
    rescuerId: string;
}
