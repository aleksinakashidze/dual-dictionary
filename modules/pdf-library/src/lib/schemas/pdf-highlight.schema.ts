import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from '@dual-dictionary/database';

export type PdfHighlightDocument = PdfHighlight & Document;

@Schema({ timestamps: true })
export class PdfHighlight extends BaseSchema {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: 'PdfBook', index: true })
  bookId!: Types.ObjectId;

  @Prop({ required: true, trim: true })
  bookTitle!: string;

  @Prop({ required: true, trim: true, maxlength: 180 })
  title!: string;

  @Prop({ required: true, trim: true, maxlength: 5000 })
  text!: string;

  @Prop({ trim: true, maxlength: 2000, default: '' })
  comment!: string;

  @Prop({ default: 1, min: 1 })
  page!: number;

  @Prop({ type: Object, default: null })
  selection!: Record<string, unknown> | null;
}

export const PdfHighlightSchema = SchemaFactory.createForClass(PdfHighlight);

PdfHighlightSchema.index({ userId: 1, createdAt: -1 });
PdfHighlightSchema.index({ userId: 1, bookId: 1, page: 1 });
