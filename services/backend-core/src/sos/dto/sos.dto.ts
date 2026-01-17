import { IsString, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { AlertStatus, AlertPriority } from '../../database/entities/alert.entity';

export class CreateSosDto {
    @IsUUID()
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
    @IsUUID()
    alertId: string;

    @IsEnum(AlertStatus)
    status: AlertStatus;

    @IsString()
    @IsOptional()
    notes?: string;
}

export class AssignRescuerDto {
    @IsUUID()
    alertId: string;

    @IsUUID()
    rescuerId: string;
}
