import { ApiProperty } from '@nestjs/swagger';
import { WordDocument } from '../schemas/word.schema';

export class WordResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  word!: string;

  @ApiProperty()
  translation!: string;

  @ApiProperty()
  createdAt!: Date;

  static from(doc: WordDocument): WordResponseDto {
    return {
      id: doc._id.toString(),
      word: doc.word,
      translation: doc.translation,
      createdAt: doc.createdAt,
    };
  }
}
