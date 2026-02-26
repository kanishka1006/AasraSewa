import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { IsNotEmpty, IsPhoneNumber, IsBoolean } from 'class-validator';
import { Role } from './role.entity';
import { Rental } from './rental.entity';
import { SosAlert } from './alert.entity';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    @IsNotEmpty()
    fullName: string;

    @Prop({ unique: true, index: true, required: true })
    @IsPhoneNumber('IN')
    phoneNumber: string;

    @Prop()
    age: number;

    @Prop({ select: false })
    passwordHash: string;

    @Prop({ default: true })
    @IsBoolean()
    isSafe: boolean;

    @Prop({ type: MongooseSchema.Types.Mixed })
    lastKnownLocation: Record<string, any>;

    @Prop()
    fcmToken: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Role' })
    role: any;

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Rental' }] })
    rentals: any[];

    @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'SosAlert' }] })
    alerts: any[];
}

export const UserSchema = SchemaFactory.createForClass(User);
