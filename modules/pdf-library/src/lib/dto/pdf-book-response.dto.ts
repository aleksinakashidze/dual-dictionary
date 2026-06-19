import { ApiProperty } from '@nestjs/swagger';
import { PdfBookDocument, PdfStorageProvider } from '../schemas/pdf-book.schema';
import { decodePossibleUtf8Mojibake } from '../utils/text-encoding.util';

export class PdfBookResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  originalFileName!: string;

  @ApiProperty({ enum: ['local', 's3'] })
  storageProvider!: PdfStorageProvider;

  @ApiProperty()
  size!: number;

  @ApiProperty()
  lastPage!: number;

  @ApiProperty({ nullable: true })
  totalPages!: number | null;

  @ApiProperty({ nullable: true })
  lastReadAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  static from(doc: PdfBookDocument): PdfBookResponseDto {
    return {
      id: doc._id.toString(),
      title: decodePossibleUtf8Mojibake(doc.title),
      originalFileName: decodePossibleUtf8Mojibake(doc.originalFileName),
      storageProvider: doc.storageProvider,
      size: doc.size,
      lastPage: doc.lastPage,
      totalPages: doc.totalPages,
      lastReadAt: doc.lastReadAt,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}
