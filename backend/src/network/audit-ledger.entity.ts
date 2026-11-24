import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AuditLedgerDocument = AuditLedger & Document;

@Schema({ collection: 'auditledger', timestamps: true })
export class AuditLedger {
    @Prop({ required: true })
    type: string;

    @Prop()
    hash: string;

    @Prop()
    prevHash: string;

    @Prop()
    shelterName: string;

    @Prop()
    bandId: string;

    @Prop()
    distanceMeters: number;

    @Prop()
    rescuerName: string;

    @Prop({ type: MongooseSchema.Types.Mixed })
    model: Record<string, unknown>;

    @Prop({ type: MongooseSchema.Types.Mixed })
    event: Record<string, unknown>;
}

export const AuditLedgerSchema = SchemaFactory.createForClass(AuditLedger);
