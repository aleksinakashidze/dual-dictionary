import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class StudyListByDateDto {
  @ApiProperty({
    description: 'ISO date string (e.g. 2025-04-14)',
    example: '2025-04-14',
  })
  @IsDateString()
  date!: string;
}
