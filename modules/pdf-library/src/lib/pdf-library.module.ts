import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '@dual-dictionary/common';
import { DictionaryModule } from '@dual-dictionary/dictionary';
import { StudyListModule } from '@dual-dictionary/study-list';
import { PdfBook, PdfBookSchema } from './schemas/pdf-book.schema';
import { PdfHighlight, PdfHighlightSchema } from './schemas/pdf-highlight.schema';
import { PdfBookRepository } from './repositories/pdf-book.repository';
import { PdfHighlightRepository } from './repositories/pdf-highlight.repository';
import { PdfStorageService } from './services/pdf-storage.service';
import { PdfLibraryService } from './services/pdf-library.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PdfBook.name, schema: PdfBookSchema },
      { name: PdfHighlight.name, schema: PdfHighlightSchema },
    ]),
    CommonModule,
    DictionaryModule,
    StudyListModule,
  ],
  providers: [
    PdfBookRepository,
    PdfHighlightRepository,
    PdfStorageService,
    PdfLibraryService,
  ],
  exports: [PdfLibraryService],
})
export class PdfLibraryModule {}
