import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@dual-dictionary/database';
import { PdfBook, PdfBookDocument } from '../schemas/pdf-book.schema';

@Injectable()
export class PdfBookRepository extends BaseRepository<PdfBookDocument> {
  constructor(
    @InjectModel(PdfBook.name)
    private readonly bookModel: Model<PdfBookDocument>,
  ) {
    super(bookModel);
  }

  async findByUser(userId: string): Promise<PdfBookDocument[]> {
    return this.bookModel
      .find({ userId: new Types.ObjectId(userId), isDeleted: false })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findByIdAndUser(
    bookId: string,
    userId: string,
  ): Promise<PdfBookDocument | null> {
    return this.bookModel
      .findOne({
        _id: new Types.ObjectId(bookId),
        userId: new Types.ObjectId(userId),
        isDeleted: false,
      })
      .exec();
  }
}
