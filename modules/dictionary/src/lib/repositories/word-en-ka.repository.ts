import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '@dual-dictionary/database';
import { WordDocument } from '../schemas/word.schema';

@Injectable()
export class WordEnKaRepository extends BaseRepository<WordDocument> {
  constructor(
    @InjectModel('WordEnKa') model: Model<WordDocument>,
  ) {
    super(model);
  }

  async searchByPrefix(prefix: string, limit: number): Promise<WordDocument[]> {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.model
      .find({
        word: { $regex: `^${escaped}`, $options: 'i' },
        isDeleted: false,
      })
      .limit(limit)
      .exec();
  }
}
