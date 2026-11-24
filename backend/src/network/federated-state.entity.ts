import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type FederatedStateDocument = FederatedState & Document;

@Schema({ collection: 'federated_state', timestamps: true })
export class FederatedState {
    @Prop({ required: true, unique: true, default: 'global' })
    key: string;

    @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
    model: Record<string, number>;
}

export const FederatedStateSchema = SchemaFactory.createForClass(FederatedState);
