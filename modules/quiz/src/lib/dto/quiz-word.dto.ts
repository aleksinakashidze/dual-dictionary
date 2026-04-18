import { ApiProperty } from '@nestjs/swagger';
import { DirectionEnum } from '@dual-dictionary/dictionary';

export class QuizWordDto {
  @ApiProperty({ description: 'StudyListEntry _id — send back in /check' })
  entryId!: string;

  @ApiProperty({ description: 'The word to translate (no translation shown)' })
  word!: string;

  @ApiProperty({ enum: DirectionEnum })
  direction!: DirectionEnum;
}
