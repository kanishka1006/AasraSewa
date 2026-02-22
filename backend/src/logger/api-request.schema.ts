import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ApiRequestDocument = HydratedDocument<ApiRequest>;

@Schema({ timestamps: true })
export class ApiRequest {
    @Prop({ required: true })
    method: string;

    @Prop({ required: true })
    url: string;

    @Prop({ required: true })
    statusCode: number;

    @Prop({ required: true })
    latencyMs: number;

    @Prop()
    ipAddress: string;

    @Prop({ type: Object })
    body: Record<string, any>;

    @Prop({ type: Object })
    query: Record<string, any>;

    @Prop()
    userAgent: string;

    @Prop()
    userId?: string;

    @Prop({ required: true })
    timestamp: Date;
}

export const ApiRequestSchema = SchemaFactory.createForClass(ApiRequest);
