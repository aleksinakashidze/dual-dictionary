import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationTypeEnum } from '../enums/notification-type.enum';

export class NotificationDto {
  @ApiProperty({ enum: NotificationTypeEnum })
  type: NotificationTypeEnum;

  @ApiProperty()
  message: string;
}

export class BaseResponseDto<T = unknown> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  statusCode: number;

  @ApiPropertyOptional()
  data?: T;

  @ApiPropertyOptional({ type: [NotificationDto] })
  notifications?: NotificationDto[];

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional()
  timestamp?: string;

  static ok<T>(data: T, message?: string): BaseResponseDto<T> {
    return {
      success: true,
      statusCode: 200,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  static created<T>(data: T, message?: string): BaseResponseDto<T> {
    return {
      success: true,
      statusCode: 201,
      data,
      message,
      timestamp: new Date().toISOString(),
    };
  }

  static error(
    message: string,
    statusCode = 500,
    notifications?: NotificationDto[],
  ): BaseResponseDto {
    return {
      success: false,
      statusCode,
      message,
      notifications,
      timestamp: new Date().toISOString(),
    };
  }
}
