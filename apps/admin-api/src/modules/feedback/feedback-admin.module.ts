import { Module } from '@nestjs/common';
import { FeedbackModule } from '@dual-dictionary/feedback';
import { FeedbackAdminController } from './feedback-admin.controller';

@Module({
  imports: [FeedbackModule],
  controllers: [FeedbackAdminController],
})
export class FeedbackAdminModule {}
