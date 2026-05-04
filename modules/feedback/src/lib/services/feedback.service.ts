import { Injectable } from '@nestjs/common';
import { PageResultDto } from '@dual-dictionary/common';
import { FeedbackRepository } from '../repositories/feedback.repository';
import { CreateFeedbackDto } from '../dto/create-feedback.dto';
import { FeedbackFilterDto } from '../dto/feedback-filter.dto';
import { FeedbackResponseDto } from '../dto/feedback-response.dto';
import { FeedbackDocument, FeedbackStatus } from '../schemas/feedback.schema';

@Injectable()
export class FeedbackService {
  constructor(private readonly feedbackRepo: FeedbackRepository) {}

  async create(
    dto: CreateFeedbackDto,
    user?: { sub: string; username: string },
  ): Promise<FeedbackDocument> {
    return this.feedbackRepo.create({
      ...dto,
      userId: user?.sub ?? null,
      username: user?.username ?? null,
    });
  }

  async findAll(filter: FeedbackFilterDto): Promise<PageResultDto<FeedbackResponseDto>> {
    const query: Record<string, unknown> = {};
    if (filter.status) query['status'] = filter.status;

    const result = await this.feedbackRepo.findPaginated(
      query,
      filter.page,
      filter.limit,
      { createdAt: -1 },
    );

    return PageResultDto.from({
      ...result,
      data: result.data.map(FeedbackResponseDto.from),
    });
  }

  async markAsRead(id: string): Promise<void> {
    await this.feedbackRepo.updateById(id, { status: FeedbackStatus.Read });
  }

  async countUnread(): Promise<number> {
    return this.feedbackRepo.count({ status: FeedbackStatus.Unread });
  }
}
