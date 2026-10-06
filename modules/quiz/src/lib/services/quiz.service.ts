import { Injectable } from '@nestjs/common';
import { StudyListService } from '@dual-dictionary/study-list';
import { QuizWordDto } from '../dto/quiz-word.dto';
import { CheckAnswerDto } from '../dto/check-answer.dto';
import { CheckAnswerResponseDto } from '../dto/check-answer-response.dto';
import { isAnswerCorrect } from '../utils/answer-matcher';

@Injectable()
export class QuizService {
  constructor(private readonly studyListService: StudyListService) {}

  async getSession(userId: string, date: Date): Promise<QuizWordDto[]> {
    const entries = await this.studyListService.getByDate(userId, date);

    // Fisher-Yates shuffle for unbiased random order
    const shuffled = [...entries];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.map((e) => ({
      entryId: e._id.toString(),
      word: e.word,
      direction: e.direction,
      // translation intentionally omitted
    }));
  }

  async checkAnswer(
    userId: string,
    dto: CheckAnswerDto,
  ): Promise<CheckAnswerResponseDto> {
    const entry = await this.studyListService.findEntryById(userId, dto.entryId);

    // Translations pack several alternatives ("ხილვადი, ცხადი ◊ ცხადი");
    // any single alternative counts as a correct answer.
    const correct = isAnswerCorrect(entry.translation, dto.answer);

    await this.studyListService.recordAttempt(dto.entryId, correct);

    return {
      correct,
      correctAnswer: entry.translation,
      incorrectCount: entry.incorrectCount + (correct ? 0 : 1),
      totalAttempts: entry.totalAttempts + 1,
    };
  }
}
