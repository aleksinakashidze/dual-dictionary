import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '@dual-dictionary/database';

export type FeedbackDocument = Feedback & Document;

export enum FeedbackType {
  Bug = 'bug',
  Suggestion = 'suggestion',
  Praise = 'praise',
  Other = 'other',
}

export enum FeedbackStatus {
  Unread = 'unread',
  Read = 'read',
}

@Schema({ timestamps: true })
export class Feedback extends BaseSchema {
  @Prop({ required: true, enum: Object.values(FeedbackType) })
  type!: FeedbackType;

  @Prop({ required: true, trim: true, minlength: 5, maxlength: 1000 })
  message!: string;

  @Prop({ type: String, enum: Object.values(FeedbackStatus), default: FeedbackStatus.Unread })
  status!: FeedbackStatus;

  @Prop({ type: String, default: null })
  userId!: string | null;

  @Prop({ type: String, default: null })
  username!: string | null;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
FeedbackSchema.index({ status: 1, createdAt: -1 });
