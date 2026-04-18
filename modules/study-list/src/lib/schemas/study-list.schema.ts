import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from '@dual-dictionary/database';
import { DirectionEnum } from '@dual-dictionary/dictionary';

export type StudyListEntryDocument = StudyListEntry & Document;

@Schema({ timestamps: true })
export class StudyListEntry extends BaseSchema {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId })
  wordId!: Types.ObjectId;

  // Denormalized — no join needed at runtime
  @Prop({ required: true, trim: true })
  word!: string;

  @Prop({ required: true, trim: true })
  translation!: string;

  @Prop({ required: true, type: String, enum: DirectionEnum })
  direction!: DirectionEnum;

  // Each Date is a separate "add" event (re-add with force:true pushes a new entry)
  @Prop({ type: [Date], default: [] })
  addedDates!: Date[];

  @Prop({ default: 0 })
  incorrectCount!: number;

  @Prop({ default: 0 })
  totalAttempts!: number;
}

export const StudyListEntrySchema = SchemaFactory.createForClass(StudyListEntry);

// One entry per user+word combination (direction determines which collection)
StudyListEntrySchema.index(
  { userId: 1, wordId: 1, direction: 1 },
  { unique: true },
);

// Fast date-range queries for quiz/study sessions
StudyListEntrySchema.index({ userId: 1, addedDates: 1 });
