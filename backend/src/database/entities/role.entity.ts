import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
  ADMIN = 'ADMIN',
  SHELTER_MANAGER = 'SHELTER_MANAGER',
  RESCUER = 'RESCUER',
  CITIZEN = 'CITIZEN',
  VOLUNTEER = 'VOLUNTEER',
}

export type RoleDocument = Role & Document;

@Schema()
export class Role {
  @Prop({ type: String, enum: UserRole, unique: true, required: true })
  name: UserRole;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Object, default: {} })
  permissions: Record<string, boolean>;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
