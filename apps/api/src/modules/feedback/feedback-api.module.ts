import { Module } from '@nestjs/common';
import { FeedbackModule } from '@dual-dictionary/feedback';
import { FeedbackApiController } from './feedback-api.controller';

@Module({
  imports: [FeedbackModule],
  controllers: [FeedbackApiController],
})
export class FeedbackApiModule {}
