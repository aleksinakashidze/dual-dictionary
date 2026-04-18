import { Module } from '@nestjs/common';
import { StudyListModule } from '@dual-dictionary/study-list';
import { QuizService } from './services/quiz.service';

@Module({
  imports: [StudyListModule],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
