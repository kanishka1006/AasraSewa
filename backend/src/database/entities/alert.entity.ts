import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export enum AlertStatus {
    OPEN = 'OPEN',
    ASSIGNED = 'ASSIGNED',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    FALSE_ALARM = 'FALSE_ALARM',
}

export enum AlertPriority {
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL',
}

export type SosAlertDocument = SosAlert & Document;

@Schema({ timestamps: true })
export class SosAlert {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    victim: any;

    @Prop()
    victimId: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
    rescuer: any;

    @Prop()
    rescuerId: string;

    @Prop({ type: String, enum: AlertStatus, default: AlertStatus.OPEN })
    status: AlertStatus;

    @Prop({ type: String, enum: AlertPriority, default: AlertPriority.HIGH })
    priority: AlertPriority;

    @Prop({ type: MongooseSchema.Types.Mixed })
    location: object;

    @Prop()
    notes: string;

    @Prop({ type: Date })
    resolvedAt: Date;
}

export const SosAlertSchema = SchemaFactory.createForClass(SosAlert);
