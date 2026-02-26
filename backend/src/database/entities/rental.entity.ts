import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { IsNumber, Min } from 'class-validator';

export enum RentalStatus {
    ACTIVE = 'ACTIVE',
    COMPLETED = 'COMPLETED',
    OVERDUE = 'OVERDUE',
}

export enum DepositStatus {
    HELD = 'HELD',
    REFUNDED = 'REFUNDED',
    FORFEITED = 'FORFEITED',
}

export type RentalDocument = Rental & Document;

@Schema({ timestamps: { createdAt: 'startTime', updatedAt: false } })
export class Rental {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    user: any;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'SmartBand', required: true })
    band: any;

    @Prop({ type: Number, default: 0 })
    @IsNumber()
    @Min(0)
    depositAmount: number;

    @Prop({ type: String, enum: DepositStatus, default: DepositStatus.HELD })
    depositStatus: DepositStatus;

    @Prop({ type: Date })
    startTime: Date;

    @Prop({ type: Date })
    endTime: Date;

    @Prop({ type: String, enum: RentalStatus, default: RentalStatus.ACTIVE })
    status: RentalStatus;

    @Prop()
    returnCondition: string;
}

export const RentalSchema = SchemaFactory.createForClass(Rental);
