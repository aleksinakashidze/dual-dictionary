import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { WordService } from '@dual-dictionary/dictionary';
import { StudyListRepository } from '../repositories/study-list.repository';
import { StudyListEntryDocument, StudyListSource } from '../schemas/study-list.schema';
import { AddToStudyListDto } from '../dto/add-to-study-list.dto';

export interface StudyListSourceInput {
  source: StudyListSource['source'];
  bookId?: string;
  bookTitle?: string;
}

@Injectable()
export class StudyListService {
  constructor(
    private readonly studyListRepo: StudyListRepository,
    private readonly wordService: WordService,
  ) {}

  async addWord(
    userId: string,
    dto: AddToStudyListDto,
    sourceInput?: StudyListSourceInput,
  ): Promise<StudyListEntryDocument> {
    const word = await this.wordService.findById(dto.wordId, dto.direction);
    const addedAt = new Date();
    const source = this.buildSource(sourceInput, addedAt);
    const existing = await this.studyListRepo.findByUserAndWord(
      userId,
      dto.wordId,
      dto.direction,
    );

    if (existing && !dto.force) {
      // Return 409 with previous dates so client can show the popup
      throw new ConflictException({
        message: 'Word already in study list',
        addedDates: existing.addedDates,
        entryId: existing._id.toString(),
      });
    }

    if (existing) {
      // force: true — push a new date without creating a duplicate document
      return this.studyListRepo.pushAddedDate(
        existing._id.toString(),
        addedAt,
        source,
      );
    }

    return this.studyListRepo.create({
      userId: new Types.ObjectId(userId),
      wordId: new Types.ObjectId(dto.wordId),
      word: word.word,
      translation: word.translation,
      direction: dto.direction,
      addedDates: [addedAt],
      sources: [source],
      incorrectCount: 0,
      totalAttempts: 0,
    });
  }

  async getByDate(
    userId: string,
    date: Date,
  ): Promise<StudyListEntryDocument[]> {
    return this.studyListRepo.findByUserAndDate(userId, date);
  }

  async findEntryById(
    userId: string,
    entryId: string,
  ): Promise<StudyListEntryDocument> {
    const entry = await this.studyListRepo.findById(entryId);
    if (!entry || entry.userId.toString() !== userId) {
      throw new NotFoundException('Study list entry not found');
    }
    return entry;
  }

  async removeWord(userId: string, entryId: string): Promise<void> {
    await this.findEntryById(userId, entryId);
    await this.studyListRepo.softDelete(entryId);
  }

  async recordAttempt(entryId: string, correct: boolean): Promise<void> {
    await this.studyListRepo.recordAttempt(entryId, correct);
  }

  private buildSource(
    input: StudyListSourceInput | undefined,
    addedAt: Date,
  ): StudyListSource {
    return {
      source: input?.source ?? 'manual',
      bookId: input?.bookId ? new Types.ObjectId(input.bookId) : null,
      bookTitle: input?.bookTitle ?? null,
      addedAt,
    };
  }
}
