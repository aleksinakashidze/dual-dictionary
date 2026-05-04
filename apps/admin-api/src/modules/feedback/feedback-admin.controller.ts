import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  Version,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiAuth, PageResultDto, Roles, RolesEnum } from '@dual-dictionary/common';
import {
  FeedbackFilterDto,
  FeedbackResponseDto,
  FeedbackService,
} from '@dual-dictionary/feedback';

@ApiTags('admin / feedback')
@Controller('admin/feedback')
@Roles(RolesEnum.Admin)
@ApiAuth()
export class FeedbackAdminController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List all feedback with pagination' })
  async findAll(
    @Query() filter: FeedbackFilterDto,
  ): Promise<PageResultDto<FeedbackResponseDto>> {
    return this.feedbackService.findAll(filter);
  }

  @Get('unread-count')
  @Version('1')
  @ApiOperation({ summary: 'Get unread feedback count' })
  async unreadCount(): Promise<{ count: number }> {
    const count = await this.feedbackService.countUnread();
    return { count };
  }

  @Patch(':id/read')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'Feedback ID' })
  @ApiOperation({ summary: 'Mark feedback as read' })
  async markAsRead(@Param('id') id: string): Promise<void> {
    await this.feedbackService.markAsRead(id);
  }
}
