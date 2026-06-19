import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { BaseSchema } from '@dual-dictionary/database';

export type PdfBookDocument = PdfBook & Document;
export type PdfStorageProvider = 'local' | 's3';

@Schema({ timestamps: true })
export class PdfBook extends BaseSchema {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User', index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, trim: true, maxlength: 180 })
  title!: string;

  @Prop({ required: true, trim: true })
  originalFileName!: string;

  @Prop({ required: true, enum: ['local', 's3'], default: 'local' })
  storageProvider!: PdfStorageProvider;

  @Prop({ required: true, trim: true, unique: true })
  storageKey!: string;

  @Prop({ required: true, trim: true, default: 'application/pdf' })
  mimeType!: string;

  @Prop({ required: true, min: 0 })
  size!: number;

  @Prop({ default: 1, min: 1 })
  lastPage!: number;

  @Prop({ type: Number, default: null, min: 1 })
  totalPages!: number | null;

  @Prop({ type: Date, default: null })
  lastReadAt!: Date | null;
}

export const PdfBookSchema = SchemaFactory.createForClass(PdfBook);

PdfBookSchema.index({ userId: 1, updatedAt: -1 });
PdfBookSchema.index({ userId: 1, title: 1 });
