import { Module } from '@nestjs/common';
import { PdfLibraryController, PdfLibraryModule } from '@dual-dictionary/pdf-library';

@Module({
  imports: [PdfLibraryModule],
  controllers: [PdfLibraryController],
})
export class PdfLibraryApiModule {}
