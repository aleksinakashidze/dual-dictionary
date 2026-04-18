import { ApiProperty } from '@nestjs/swagger';

export class CheckAnswerResponseDto {
  @ApiProperty()
  correct!: boolean;

  @ApiProperty({ description: 'The correct translation' })
  correctAnswer!: string;

  @ApiProperty({ description: 'Total incorrect attempts for this word' })
  incorrectCount!: number;

  @ApiProperty({ description: 'Total quiz attempts for this word' })
  totalAttempts!: number;
}
