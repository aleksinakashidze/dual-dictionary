import { Controller, Get, Query, Version } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public, Throttle } from '@dual-dictionary/common';
import { WordService } from '../services/word.service';
import { SearchWordDto } from '../dto/search-word.dto';
import { WordResponseDto } from '../dto/word-response.dto';

@ApiTags('dictionary')
@Controller('dictionary')
@Public()
export class WordController {
  constructor(private readonly wordService: WordService) {}

  @Get('search')
  @Version('1')
  @Throttle({ strict: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Autocomplete word search',
    description: 'Returns words starting with the given prefix (min 3 chars). Use direction=ka-en for Georgian→English, en-ka for English→Georgian.',
  })
  async search(@Query() dto: SearchWordDto): Promise<WordResponseDto[]> {
    const words = await this.wordService.search(dto.q, dto.direction, dto.limit);
    return words.map(WordResponseDto.from);
  }
}
