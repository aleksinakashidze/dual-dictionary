import { Body, Controller, HttpCode, HttpStatus, Post, Version } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, JwtPayload } from '@dual-dictionary/common';
import { CreateFeedbackDto, FeedbackResponseDto, FeedbackService } from '@dual-dictionary/feedback';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackApiController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit feedback' })
  async create(
    @Body() dto: CreateFeedbackDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<FeedbackResponseDto> {
    const doc = await this.feedbackService.create(dto, user);
    return FeedbackResponseDto.from(doc);
  }
}
