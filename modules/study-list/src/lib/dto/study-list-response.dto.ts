import { ApiProperty } from '@nestjs/swagger';
import { DirectionEnum } from '@dual-dictionary/dictionary';
import { StudyListEntryDocument, StudyListSource } from '../schemas/study-list.schema';

export class StudyListSourceResponseDto {
  @ApiProperty()
  source!: StudyListSource['source'];

  @ApiProperty({ nullable: true })
  bookId!: string | null;

  @ApiProperty({ nullable: true })
  bookTitle!: string | null;

  @ApiProperty()
  addedAt!: Date;
}

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

  @ApiProperty({ type: [StudyListSourceResponseDto] })
  sources!: StudyListSourceResponseDto[];

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
      sources: (doc.sources ?? []).map((source) => ({
        source: source.source,
        bookId: source.bookId?.toString() ?? null,
        bookTitle: source.bookTitle ?? null,
        addedAt: source.addedAt,
      })),
      incorrectCount: doc.incorrectCount,
      totalAttempts: doc.totalAttempts,
    };
  }
}
