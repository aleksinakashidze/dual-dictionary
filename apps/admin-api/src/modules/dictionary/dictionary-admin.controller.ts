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
  Version,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  ApiAuth,
  PageResultDto,
  Roles,
  RolesEnum,
} from '@dual-dictionary/common';
import {
  CreateWordDto,
  DirectionEnum,
  UpdateWordDto,
  WordResponseDto,
  WordService,
} from '@dual-dictionary/dictionary';
import { AdminSearchWordDto } from './dto/admin-search-word.dto';

@ApiTags('admin / words')
@Controller('admin/words')
@Roles(RolesEnum.Admin)
@ApiAuth()
export class DictionaryAdminController {
  constructor(private readonly wordService: WordService) {}

  @Post()
  @Version('1')
  @ApiOperation({ summary: 'Create a new word entry' })
  async create(@Body() dto: CreateWordDto): Promise<WordResponseDto> {
    const word = await this.wordService.create(dto);
    return WordResponseDto.from(word);
  }

  @Get()
  @Version('1')
  @ApiOperation({ summary: 'List words with pagination and optional search' })
  async findAll(
    @Query() dto: AdminSearchWordDto,
  ): Promise<PageResultDto<WordResponseDto>> {
    const result = await this.wordService.findPaginated(
      dto.direction,
      dto.page,
      dto.limit,
      dto.search,
    );
    return PageResultDto.from({
      ...result,
      data: result.data.map(WordResponseDto.from),
    });
  }

  @Get(':id')
  @Version('1')
  @ApiParam({ name: 'id', description: 'Word document _id' })
  @ApiQuery({ name: 'direction', enum: DirectionEnum })
  @ApiOperation({ summary: 'Get a single word by ID' })
  async findOne(
    @Param('id') id: string,
    @Query('direction') direction: DirectionEnum,
  ): Promise<WordResponseDto> {
    const word = await this.wordService.findById(id, direction);
    return WordResponseDto.from(word);
  }

  @Patch(':id')
  @Version('1')
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'direction', enum: DirectionEnum })
  @ApiOperation({ summary: 'Update word or translation' })
  async update(
    @Param('id') id: string,
    @Query('direction') direction: DirectionEnum,
    @Body() dto: UpdateWordDto,
  ): Promise<WordResponseDto> {
    const word = await this.wordService.update(id, direction, dto);
    return WordResponseDto.from(word);
  }

  @Delete(':id')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'direction', enum: DirectionEnum })
  @ApiOperation({ summary: 'Soft-delete a word entry' })
  async remove(
    @Param('id') id: string,
    @Query('direction') direction: DirectionEnum,
  ): Promise<void> {
    await this.wordService.remove(id, direction);
  }
}
