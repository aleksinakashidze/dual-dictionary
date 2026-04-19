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

  // Hashed one-time password-reset token — null when not in use
  @Prop({ type: String, default: null, select: false })
  resetToken!: string | null;

  @Prop({ type: Date, default: null, select: false })
  resetTokenExpiry!: Date | null;

  // Email verification fields
  @Prop({ default: false })
  isEmailVerified!: boolean;

  // Hashed one-time email verification token — null when verified or not in use
  @Prop({ type: String, default: null, select: false })
  emailVerificationToken!: string | null;

  @Prop({ type: Date, default: null, select: false })
  emailVerificationTokenExpiry!: Date | null;

  // Account recovery fields (for deleted accounts)
  @Prop({ type: String, default: null, select: false })
  recoveryToken!: string | null;

  @Prop({ type: Date, default: null, select: false })
  recoveryTokenExpiry!: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
