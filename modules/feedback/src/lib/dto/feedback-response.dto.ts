import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedbackDocument, FeedbackStatus, FeedbackType } from '../schemas/feedback.schema';

export class FeedbackResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: FeedbackType })
  type: FeedbackType;

  @ApiProperty()
  message: string;

  @ApiProperty({ enum: FeedbackStatus })
  status: FeedbackStatus;

  @ApiPropertyOptional()
  userId: string | null;

  @ApiPropertyOptional()
  username: string | null;

  @ApiProperty()
  createdAt: Date;

  static from(doc: FeedbackDocument): FeedbackResponseDto {
    return {
      id: doc._id.toString(),
      type: doc.type,
      message: doc.message,
      status: doc.status,
      userId: doc.userId,
      username: doc.username,
      createdAt: doc.createdAt,
    };
  }
}
