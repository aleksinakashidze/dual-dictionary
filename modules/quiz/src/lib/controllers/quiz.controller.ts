import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Version } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAuth, CurrentUser } from '@dual-dictionary/common';
import { StudyListByDateDto } from '@dual-dictionary/study-list';
import { QuizService } from '../services/quiz.service';
import { CheckAnswerDto } from '../dto/check-answer.dto';
import { CheckAnswerResponseDto } from '../dto/check-answer-response.dto';
import { QuizWordDto } from '../dto/quiz-word.dto';

@ApiTags('quiz')
@Controller('quiz')
@ApiAuth()
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get('session')
  @Version('1')
  @ApiOperation({
    summary: 'Get quiz session for a specific date',
    description:
      'Returns words added on the given date in random order, without translations.',
  })
  async getSession(
    @CurrentUser('sub') userId: string,
    @Query() dto: StudyListByDateDto,
  ): Promise<QuizWordDto[]> {
    return this.quizService.getSession(userId, new Date(dto.date));
  }

  @Post('check')
  @Version('1')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Check the user's translation answer",
    description:
      'Compares the answer to the correct translation (case/whitespace insensitive). ' +
      'Records the attempt in statistics regardless of outcome.',
  })
  async checkAnswer(
    @CurrentUser('sub') userId: string,
    @Body() dto: CheckAnswerDto,
  ): Promise<CheckAnswerResponseDto> {
    return this.quizService.checkAnswer(userId, dto);
  }
}
