import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { IsMACAddress, IsEnum, Min, Max } from 'class-validator';
import { Rental } from './rental.entity';

export enum BandStatus {
    AVAILABLE = 'AVAILABLE',
    RENTED = 'RENTED',
    MAINTENANCE = 'MAINTENANCE',
    LOST = 'LOST',
}

export type SmartBandDocument = SmartBand & Document;

@Schema({ timestamps: true })
export class SmartBand {
    @Prop({ unique: true, required: true, maxlength: 17 })
    @IsMACAddress()
    macAddress: string;

    @Prop({ unique: true, sparse: true })
    qrCodeHash: string;

    @Prop({ required: true })
    firmwareVersion: string;

    @Prop({ default: 100, min: 0, max: 100 })
    batteryLevel: number;

    @Prop({ type: String, enum: BandStatus, default: BandStatus.AVAILABLE })
    @IsEnum(BandStatus)
    status: BandStatus;

    @Prop({ type: Date })
    lastPingAt: Date;

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Rental' }] })
    rentals: any[];
}

export const SmartBandSchema = SchemaFactory.createForClass(SmartBand);
