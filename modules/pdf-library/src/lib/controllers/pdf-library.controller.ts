import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  Version,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Response } from 'express';
import { ApiAuth, CurrentUser } from '@dual-dictionary/common';
import { WordResponseDto } from '@dual-dictionary/dictionary';
import { PdfLibraryService } from '../services/pdf-library.service';
import { UploadPdfBookDto } from '../dto/upload-pdf-book.dto';
import { PdfBookResponseDto } from '../dto/pdf-book-response.dto';
import { UpdateReadingProgressDto } from '../dto/update-reading-progress.dto';
import { CreatePdfHighlightDto } from '../dto/create-pdf-highlight.dto';
import { PdfHighlightResponseDto } from '../dto/pdf-highlight-response.dto';
import { LookupPdfWordDto } from '../dto/lookup-pdf-word.dto';
import { AddPdfWordToStudyListDto } from '../dto/add-pdf-word-to-study-list.dto';
import { UpdatePdfHighlightDto } from '../dto/update-pdf-highlight.dto';
import { StudyListResponseDto } from '@dual-dictionary/study-list';

@ApiTags('pdf-library')
@ApiAuth()
@Controller('pdf-books')
export class PdfLibraryController {
  constructor(private readonly pdfLibraryService: PdfLibraryService) {}

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List PDF books owned by the authenticated user' })
  async listBooks(
    @CurrentUser('sub') userId: string,
  ): Promise<PdfBookResponseDto[]> {
    const books = await this.pdfLibraryService.listBooks(userId);
    return books.map(PdfBookResponseDto.from);
  }

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiOperation({ summary: 'Upload a PDF book into the user library' })
  async uploadBook(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadPdfBookDto,
  ): Promise<PdfBookResponseDto> {
    const book = await this.pdfLibraryService.uploadBook(userId, file, dto);
    return PdfBookResponseDto.from(book);
  }

  @Get('highlights')
  @Version('1')
  @ApiOperation({ summary: 'List all saved PDF highlights for the authenticated user' })
  async listAllHighlights(
    @CurrentUser('sub') userId: string,
  ): Promise<PdfHighlightResponseDto[]> {
    const highlights = await this.pdfLibraryService.listHighlights(userId);
    return highlights.map(PdfHighlightResponseDto.from);
  }

  @Patch('highlights/:highlightId')
  @Version('1')
  @ApiOperation({ summary: 'Update a saved PDF highlight title or comment' })
  async updateHighlight(
    @CurrentUser('sub') userId: string,
    @Param('highlightId') highlightId: string,
    @Body() dto: UpdatePdfHighlightDto,
  ): Promise<PdfHighlightResponseDto> {
    const highlight = await this.pdfLibraryService.updateHighlight(
      userId,
      highlightId,
      dto,
    );
    return PdfHighlightResponseDto.from(highlight);
  }

  @Delete('highlights/:highlightId')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a saved PDF highlight' })
  async deleteHighlight(
    @CurrentUser('sub') userId: string,
    @Param('highlightId') highlightId: string,
  ): Promise<void> {
    await this.pdfLibraryService.deleteHighlight(userId, highlightId);
  }

  @Get(':bookId')
  @Version('1')
  @ApiOperation({ summary: 'Get a PDF book owned by the authenticated user' })
  async getBook(
    @CurrentUser('sub') userId: string,
    @Param('bookId') bookId: string,
  ): Promise<PdfBookResponseDto> {
    const book = await this.pdfLibraryService.getBookForUser(userId, bookId);
    return PdfBookResponseDto.from(book);
  }

  @Get(':bookId/file')
  @Version('1')
  @ApiOperation({ summary: 'Stream a PDF book file after ownership check' })
  async streamBook(
    @CurrentUser('sub') userId: string,
    @Param('bookId') bookId: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.pdfLibraryService.streamBookFile(userId, bookId, res);
  }

  @Patch(':bookId/progress')
  @Version('1')
  @ApiOperation({ summary: 'Save the last read page for a PDF book' })
  async updateProgress(
    @CurrentUser('sub') userId: string,
    @Param('bookId') bookId: string,
    @Body() dto: UpdateReadingProgressDto,
  ): Promise<PdfBookResponseDto> {
    const book = await this.pdfLibraryService.updateProgress(userId, bookId, dto);
    return PdfBookResponseDto.from(book);
  }

  @Get(':bookId/highlights')
  @Version('1')
  @ApiOperation({ summary: 'List highlights for a PDF book' })
  async listBookHighlights(
    @CurrentUser('sub') userId: string,
    @Param('bookId') bookId: string,
  ): Promise<PdfHighlightResponseDto[]> {
    const highlights = await this.pdfLibraryService.listHighlights(userId, bookId);
    return highlights.map(PdfHighlightResponseDto.from);
  }

  @Post(':bookId/highlights')
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Save a highlighted text snippet from a PDF book' })
  async createHighlight(
    @CurrentUser('sub') userId: string,
    @Param('bookId') bookId: string,
    @Body() dto: CreatePdfHighlightDto,
  ): Promise<PdfHighlightResponseDto> {
    const highlight = await this.pdfLibraryService.createHighlight(
      userId,
      bookId,
      dto,
    );
    return PdfHighlightResponseDto.from(highlight);
  }

  @Get(':bookId/lookup')
  @Version('1')
  @ApiOperation({ summary: 'Look up a selected single word from a PDF book' })
  async lookupWord(
    @CurrentUser('sub') userId: string,
    @Param('bookId') bookId: string,
    @Query() dto: LookupPdfWordDto,
  ): Promise<WordResponseDto[]> {
    const words = await this.pdfLibraryService.lookupWord(userId, bookId, dto);
    return words.map(WordResponseDto.from);
  }

  @Post(':bookId/study-list')
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a PDF-selected word to the study list with book source metadata' })
  async addWordToStudyList(
    @CurrentUser('sub') userId: string,
    @Param('bookId') bookId: string,
    @Body() dto: AddPdfWordToStudyListDto,
  ): Promise<StudyListResponseDto> {
    const entry = await this.pdfLibraryService.addWordToStudyList(
      userId,
      bookId,
      dto,
    );
    return this.pdfLibraryService.toStudyListResponse(entry);
  }

  @Delete(':bookId')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a PDF book from the user library' })
  async deleteBook(
    @CurrentUser('sub') userId: string,
    @Param('bookId') bookId: string,
  ): Promise<void> {
    await this.pdfLibraryService.deleteBook(userId, bookId);
  }
}
