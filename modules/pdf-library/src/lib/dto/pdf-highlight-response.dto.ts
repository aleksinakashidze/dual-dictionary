import { ApiProperty } from '@nestjs/swagger';
import { PdfHighlightDocument } from '../schemas/pdf-highlight.schema';
import { decodePossibleUtf8Mojibake } from '../utils/text-encoding.util';

export class PdfHighlightResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  bookId!: string;

  @ApiProperty()
  bookTitle!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  text!: string;

  @ApiProperty()
  comment!: string;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static from(doc: PdfHighlightDocument): PdfHighlightResponseDto {
    return {
      id: doc._id.toString(),
      bookId: doc.bookId.toString(),
      bookTitle: decodePossibleUtf8Mojibake(doc.bookTitle),
      title: decodePossibleUtf8Mojibake(doc.title),
      text: doc.text,
      comment: doc.comment,
      page: doc.page,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
