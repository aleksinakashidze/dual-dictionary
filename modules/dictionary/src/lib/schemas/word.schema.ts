import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BaseSchema } from '@dual-dictionary/database';

export type WordDocument = Word & Document;

@Schema({ timestamps: true })
export class Word extends BaseSchema {
  @Prop({ required: true, trim: true })
  word!: string;

  @Prop({ required: true, trim: true })
  translation!: string;
}

export const WordSchema = SchemaFactory.createForClass(Word);

// Prefix-search index: { word: 1 } — enables fast ^regex queries per collection
WordSchema.index({ word: 1 });
