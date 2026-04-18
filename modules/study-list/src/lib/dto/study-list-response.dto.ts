import { ApiProperty } from '@nestjs/swagger';
import { DirectionEnum } from '@dual-dictionary/dictionary';
import { StudyListEntryDocument } from '../schemas/study-list.schema';

export class StudyListResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  wordId!: string;

  @ApiProperty()
  word!: string;

  @ApiProperty()
  translation!: string;

  @ApiProperty({ enum: DirectionEnum })
  direction!: DirectionEnum;

  @ApiProperty({ type: [Date] })
  addedDates!: Date[];

  @ApiProperty()
  incorrectCount!: number;

  @ApiProperty()
  totalAttempts!: number;

  static from(doc: StudyListEntryDocument): StudyListResponseDto {
    return {
      id: doc._id.toString(),
      wordId: doc.wordId.toString(),
      word: doc.word,
      translation: doc.translation,
      direction: doc.direction,
      addedDates: doc.addedDates,
      incorrectCount: doc.incorrectCount,
      totalAttempts: doc.totalAttempts,
    };
  }
}
