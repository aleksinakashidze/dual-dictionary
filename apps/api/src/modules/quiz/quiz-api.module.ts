import { Module } from '@nestjs/common';
import { QuizModule } from '@dual-dictionary/quiz';
import { QuizController } from '@dual-dictionary/quiz';

@Module({
  imports: [QuizModule],
  controllers: [QuizController],
})
export class QuizApiModule {}
