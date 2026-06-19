import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@dual-dictionary/database';
import {
  PdfHighlight,
  PdfHighlightDocument,
} from '../schemas/pdf-highlight.schema';

@Injectable()
export class PdfHighlightRepository extends BaseRepository<PdfHighlightDocument> {
  constructor(
    @InjectModel(PdfHighlight.name)
    private readonly highlightModel: Model<PdfHighlightDocument>,
  ) {
    super(highlightModel);
  }

  async findByUser(
    userId: string,
    bookId?: string,
  ): Promise<PdfHighlightDocument[]> {
    const filter: Record<string, unknown> = {
      userId: new Types.ObjectId(userId),
      isDeleted: false,
    };
    if (bookId) filter['bookId'] = new Types.ObjectId(bookId);

    return this.highlightModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByIdAndUser(
    highlightId: string,
    userId: string,
  ): Promise<PdfHighlightDocument | null> {
    return this.highlightModel
      .findOne({
        _id: new Types.ObjectId(highlightId),
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .exec();
  }
}
