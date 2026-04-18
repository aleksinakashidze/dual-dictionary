import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '@dual-dictionary/database';
import { Word, WordDocument } from '../schemas/word.schema';

@Injectable()
export class WordKaEnRepository extends BaseRepository<WordDocument> {
  constructor(
    @InjectModel('WordKaEn') model: Model<WordDocument>,
  ) {
    super(model);
  }

  async searchByPrefix(prefix: string, limit: number): Promise<WordDocument[]> {
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      console.log('Searching for prefix:', escaped);
    return this.model
      .find({
        word: { $regex: `^${escaped}`, $options: 'i' },
        isDeleted: false,
      })
      .limit(limit)
      .exec();
  }
}
