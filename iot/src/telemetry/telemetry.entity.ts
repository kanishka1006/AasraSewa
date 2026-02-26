import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TelemetryEntityDocument = TelemetryEntity & Document;

@Schema({ timestamps: false, collection: 'device_telemetry' })
export class TelemetryEntity {
    @Prop({ required: true, index: true })
    bandId: string;

    @Prop({ type: Date, required: true, index: true })
    timestamp: Date;

    @Prop({ type: MongooseSchema.Types.Mixed })
    location: object;

    @Prop()
    heartRate: number;

    @Prop()
    spO2: number;

    @Prop()
    temperature: number;

    @Prop()
    batteryLevel: number;

    @Prop({ default: false })
    isSos: boolean;

    @Prop({ type: MongooseSchema.Types.Mixed })
    rawPayload: any;
}

export const TelemetryEntitySchema = SchemaFactory.createForClass(TelemetryEntity);
