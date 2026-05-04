import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '@dual-dictionary/database';
import { Feedback, FeedbackDocument } from '../schemas/feedback.schema';

@Injectable()
export class FeedbackRepository extends BaseRepository<FeedbackDocument> {
  constructor(@InjectModel(Feedback.name) model: Model<FeedbackDocument>) {
    super(model);
  }
}
