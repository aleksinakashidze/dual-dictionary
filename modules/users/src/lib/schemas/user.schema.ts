import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '@dual-dictionary/database';
import { GenderEnum, RolesEnum } from '@dual-dictionary/common';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User extends BaseSchema {
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  username!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ required: true, select: false })
  password!: string;

  @Prop({ type: String, enum: GenderEnum, required: false, default: null })
  gender!: GenderEnum | null;

  @Prop({ type: Date, required: false, default: null })
  birthDate!: Date | null;

  @Prop({ type: String, trim: true, required: false, default: null })
  phoneNumber!: string | null;

  @Prop({ type: [String], enum: RolesEnum, default: [RolesEnum.User] })
  roles!: RolesEnum[];

  @Prop({ default: true })
  isActive!: boolean;

  // Hashed refresh token — null after logout
  @Prop({ type: String, default: null, select: false })
  refreshToken!: string | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
