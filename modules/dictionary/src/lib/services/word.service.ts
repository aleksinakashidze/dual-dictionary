import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResult } from '@dual-dictionary/database';
import { WordKaEnRepository } from '../repositories/word-ka-en.repository';
import { WordEnKaRepository } from '../repositories/word-en-ka.repository';
import { WordDocument } from '../schemas/word.schema';
import { DirectionEnum } from '../enums/direction.enum';
import { CreateWordDto } from '../dto/create-word.dto';
import { UpdateWordDto } from '../dto/update-word.dto';

@Injectable()
export class WordService {
  constructor(
    private readonly kaEnRepo: WordKaEnRepository,
    private readonly enKaRepo: WordEnKaRepository,
  ) {}

  private repo(direction: DirectionEnum) {
    const a = direction === DirectionEnum.KaEn ? this.kaEnRepo : this.enKaRepo;
    console.log('Selected repository:', { direction, repo: a.constructor.name });
    return direction === DirectionEnum.KaEn ? this.kaEnRepo : this.enKaRepo;
  }

  async search(
    q: string,
    direction: DirectionEnum,
    limit = 10,
  ): Promise<WordDocument[]> {
    return this.repo(direction).searchByPrefix(q, limit);
  }

  async findById(id: string, direction: DirectionEnum): Promise<WordDocument> {
    console.log('Finding word by ID:', { id, direction });
    const doc = await this.repo(direction).findById(id);
    console.log('Found word document:', doc);
    if (!doc) throw new NotFoundException('Word not found');
    return doc;
  }

  async findPaginated(
    direction: DirectionEnum,
    page = 1,
    limit = 20,
    search?: string,
  ): Promise<PaginatedResult<WordDocument>> {
    const filter = search
      ? { word: { $regex: search, $options: 'i' } }
      : {};
    return this.repo(direction).findPaginated(filter as never, page, limit);
  }

  async create(dto: CreateWordDto): Promise<WordDocument> {
    return this.repo(dto.direction).create({
      word: dto.word,
      translation: dto.translation,
    });
  }

  async update(
    id: string,
    direction: DirectionEnum,
    dto: UpdateWordDto,
  ): Promise<WordDocument> {
    return this.repo(direction).updateById(id, dto);
  }

  async remove(id: string, direction: DirectionEnum): Promise<void> {
    await this.repo(direction).softDelete(id);
  }
}
