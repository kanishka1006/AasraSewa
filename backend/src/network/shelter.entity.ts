import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ShelterDocument = Shelter & Document;

@Schema({ collection: 'shelters', timestamps: true })
export class Shelter {
    @Prop({ required: true, unique: true })
    name: string;

    @Prop({ required: true })
    lat: number;

    @Prop({ required: true })
    lon: number;

    @Prop({ default: 'SOLAR' })
    powerSource: string;

    @Prop({ type: [String], default: [] })
    bands: string[];

    @Prop({ default: 'OPEN' })
    status: string;
}

export const ShelterSchema = SchemaFactory.createForClass(Shelter);
