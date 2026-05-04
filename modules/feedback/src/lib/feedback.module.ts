import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Feedback, FeedbackSchema } from './schemas/feedback.schema';
import { FeedbackRepository } from './repositories/feedback.repository';
import { FeedbackService } from './services/feedback.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Feedback.name, schema: FeedbackSchema }])],
  providers: [FeedbackRepository, FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
