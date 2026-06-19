import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import {
  DirectionEnum,
  WordDocument,
  WordService,
} from '@dual-dictionary/dictionary';
import {
  StudyListEntryDocument,
  StudyListResponseDto,
  StudyListService,
} from '@dual-dictionary/study-list';
import { PdfBookRepository } from '../repositories/pdf-book.repository';
import { PdfHighlightRepository } from '../repositories/pdf-highlight.repository';
import { PdfStorageService } from './pdf-storage.service';
import { PdfBookDocument } from '../schemas/pdf-book.schema';
import { PdfHighlightDocument } from '../schemas/pdf-highlight.schema';
import { UploadPdfBookDto } from '../dto/upload-pdf-book.dto';
import { UpdateReadingProgressDto } from '../dto/update-reading-progress.dto';
import { CreatePdfHighlightDto } from '../dto/create-pdf-highlight.dto';
import { UpdatePdfHighlightDto } from '../dto/update-pdf-highlight.dto';
import { LookupPdfWordDto } from '../dto/lookup-pdf-word.dto';
import { AddPdfWordToStudyListDto } from '../dto/add-pdf-word-to-study-list.dto';
import { Response } from 'express';
import { decodePossibleUtf8Mojibake } from '../utils/text-encoding.util';

@Injectable()
export class PdfLibraryService {
  constructor(
    private readonly books: PdfBookRepository,
    private readonly highlights: PdfHighlightRepository,
    private readonly storage: PdfStorageService,
    private readonly wordService: WordService,
    private readonly studyListService: StudyListService,
  ) {}

  async uploadBook(
    userId: string,
    file: Express.Multer.File | undefined,
    dto: UploadPdfBookDto,
  ): Promise<PdfBookDocument> {
    this.validateUpload(file);
    const stored = await this.storage.save(file!, userId);
    const originalFileName = decodePossibleUtf8Mojibake(file!.originalname);
    const title = this.normalizeTitle(dto.title, originalFileName);

    return this.books.create({
      userId: new Types.ObjectId(userId),
      title,
      originalFileName,
      storageProvider: stored.storageProvider,
      storageKey: stored.storageKey,
      mimeType: 'application/pdf',
      size: file!.size,
      lastPage: 1,
      totalPages: null,
      lastReadAt: null,
    });
  }

  async listBooks(userId: string): Promise<PdfBookDocument[]> {
    return this.books.findByUser(userId);
  }

  async getBookForUser(
    userId: string,
    bookId: string,
  ): Promise<PdfBookDocument> {
    if (!Types.ObjectId.isValid(bookId)) {
      throw new NotFoundException('PDF book not found');
    }
    const book = await this.books.findByIdAndUser(bookId, userId);
    if (!book) throw new NotFoundException('PDF book not found');
    return book;
  }

  async updateProgress(
    userId: string,
    bookId: string,
    dto: UpdateReadingProgressDto,
  ): Promise<PdfBookDocument> {
    const book = await this.getBookForUser(userId, bookId);
    const totalPages = dto.totalPages ?? book.totalPages;
    const maxPage = totalPages ?? dto.page;
    const page = Math.max(1, Math.min(dto.page, maxPage));

    return this.books.updateById(book._id, {
      lastPage: page,
      totalPages,
      lastReadAt: new Date(),
    });
  }

  async deleteBook(userId: string, bookId: string): Promise<void> {
    const book = await this.getBookForUser(userId, bookId);
    await this.storage.delete(book);
    await this.books.softDelete(book._id);
  }

  async streamBookFile(
    userId: string,
    bookId: string,
    res: Response,
  ): Promise<void> {
    const book = await this.getBookForUser(userId, bookId);
    await this.storage.send(book, res);
  }

  async createHighlight(
    userId: string,
    bookId: string,
    dto: CreatePdfHighlightDto,
  ): Promise<PdfHighlightDocument> {
    const book = await this.getBookForUser(userId, bookId);
    const text = dto.text.trim();
    if (!text) throw new BadRequestException('Highlighted text is required');

    return this.highlights.create({
      userId: new Types.ObjectId(userId),
      bookId: book._id,
      bookTitle: book.title,
      title: this.normalizeTitle(dto.title, book.title),
      text,
      comment: dto.comment?.trim() ?? '',
      page: dto.page ?? book.lastPage,
      selection: dto.selection ?? null,
    });
  }

  async listHighlights(
    userId: string,
    bookId?: string,
  ): Promise<PdfHighlightDocument[]> {
    if (bookId) await this.getBookForUser(userId, bookId);
    return this.highlights.findByUser(userId, bookId);
  }

  async updateHighlight(
    userId: string,
    highlightId: string,
    dto: UpdatePdfHighlightDto,
  ): Promise<PdfHighlightDocument> {
    const highlight = await this.getHighlightForUser(userId, highlightId);
    return this.highlights.updateById(highlight._id, {
      ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
      ...(dto.comment !== undefined ? { comment: dto.comment.trim() } : {}),
    });
  }

  async deleteHighlight(userId: string, highlightId: string): Promise<void> {
    const highlight = await this.getHighlightForUser(userId, highlightId);
    await this.highlights.softDelete(highlight._id);
  }

  async lookupWord(
    userId: string,
    bookId: string,
    dto: LookupPdfWordDto,
  ): Promise<WordDocument[]> {
    await this.getBookForUser(userId, bookId);
    const q = this.normalizeLookupWord(dto.q);
    if (!q) return [];
    const direction = dto.direction ?? this.guessDirection(q);
    const words = await this.wordService.search(q, direction, 5);
    return words.sort((a, b) => {
      const aExact = a.word.toLocaleLowerCase() === q.toLocaleLowerCase();
      const bExact = b.word.toLocaleLowerCase() === q.toLocaleLowerCase();
      return Number(bExact) - Number(aExact);
    });
  }

  async addWordToStudyList(
    userId: string,
    bookId: string,
    dto: AddPdfWordToStudyListDto,
  ): Promise<StudyListEntryDocument> {
    const book = await this.getBookForUser(userId, bookId);
    return this.studyListService.addWord(
      userId,
      {
        wordId: dto.wordId,
        direction: dto.direction,
        force: dto.force ?? true,
      },
      {
        source: 'pdf-book',
        bookId: book._id.toString(),
        bookTitle: book.title,
      },
    );
  }

  toStudyListResponse(entry: StudyListEntryDocument): StudyListResponseDto {
    return StudyListResponseDto.from(entry);
  }

  private async getHighlightForUser(
    userId: string,
    highlightId: string,
  ): Promise<PdfHighlightDocument> {
    if (!Types.ObjectId.isValid(highlightId)) {
      throw new NotFoundException('PDF highlight not found');
    }
    const highlight = await this.highlights.findByIdAndUser(highlightId, userId);
    if (!highlight) throw new NotFoundException('PDF highlight not found');
    return highlight;
  }

  private validateUpload(file: Express.Multer.File | undefined): void {
    if (!file) throw new BadRequestException('PDF file is required');
    if (file.size > this.storage.maxFileSizeBytes) {
      throw new BadRequestException('PDF file is too large');
    }
    const hasPdfMime = file.mimetype === 'application/pdf';
    const originalFileName = decodePossibleUtf8Mojibake(file.originalname);
    const hasPdfExtension = originalFileName.toLowerCase().endsWith('.pdf');
    const hasPdfMagic = file.buffer.subarray(0, 5).toString('utf8') === '%PDF-';
    if (!hasPdfMime || !hasPdfExtension || !hasPdfMagic) {
      throw new BadRequestException('Only valid PDF files are allowed');
    }
  }

  private normalizeTitle(title: string | undefined, fallback: string): string {
    const raw = decodePossibleUtf8Mojibake(title?.trim() || fallback.trim())
      .replace(/\.pdf$/i, '');
    return raw.slice(0, 180) || 'Untitled PDF';
  }

  private normalizeLookupWord(value: string): string {
    return value
      .trim()
      .replace(/[^\p{L}'-]+/gu, '')
      .slice(0, 80);
  }

  private guessDirection(word: string): DirectionEnum {
    return /[\u10A0-\u10FF]/.test(word)
      ? DirectionEnum.KaEn
      : DirectionEnum.EnKa;
  }
}
