import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { FeedbackType } from '../schemas/feedback.schema';

export class CreateFeedbackDto {
  @ApiProperty({ enum: FeedbackType })
  @IsEnum(FeedbackType)
  type: FeedbackType;

  @ApiProperty({ minLength: 5, maxLength: 1000 })
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  message: string;
}
