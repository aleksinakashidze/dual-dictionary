import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BaseRepository } from '@dual-dictionary/database';
import { DirectionEnum } from '@dual-dictionary/dictionary';
import {
  StudyListEntry,
  StudyListEntryDocument,
} from '../schemas/study-list.schema';

@Injectable()
export class StudyListRepository extends BaseRepository<StudyListEntryDocument> {
  constructor(
    @InjectModel(StudyListEntry.name)
    private readonly entryModel: Model<StudyListEntryDocument>,
  ) {
    super(entryModel);
  }

  async findByUserAndWord(
    userId: string,
    wordId: string,
    direction: DirectionEnum,
  ): Promise<StudyListEntryDocument | null> {
    return this.entryModel
      .findOne({
        // userId: new Types.ObjectId(userId),
        wordId: new Types.ObjectId(wordId),
        direction,
        // isDeleted: false,
      })
      .exec();
  }

  async findByUserAndDate(
    userId: string,
    date: Date,
  ): Promise<StudyListEntryDocument[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return this.entryModel
      .find({
        userId: new Types.ObjectId(userId),
        addedDates: { $elemMatch: { $gte: start, $lte: end } },
        isDeleted: false,
      })
      .exec();
  }

  async pushAddedDate(
    id: string,
    date: Date,
  ): Promise<StudyListEntryDocument> {
    const doc = await this.entryModel
      .findByIdAndUpdate(
        id,
        { $push: { addedDates: date } },
        { returnDocument: 'after' },
      )
      .exec();
    if (!doc) throw new Error('StudyListEntry not found');
    return doc;
  }

  async recordAttempt(
    id: string,
    correct: boolean,
  ): Promise<void> {
    const inc: Record<string, number> = { totalAttempts: 1 };
    if (!correct) inc['incorrectCount'] = 1;

    await this.entryModel
      .findByIdAndUpdate(id, { $inc: inc })
      .exec();
  }
}
