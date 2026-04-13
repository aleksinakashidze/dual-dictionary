import { Prop, Schema } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BaseDocument<T> = T & Document;

@Schema({ timestamps: true })
export abstract class BaseSchema {
  _id: Types.ObjectId;

  @Prop({ default: false, index: true })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  // Injected automatically by mongoose via { timestamps: true }
  createdAt: Date;
  updatedAt: Date;
}
