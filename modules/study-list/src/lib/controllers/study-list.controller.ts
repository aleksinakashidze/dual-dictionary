import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, Version } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAuth, CurrentUser } from '@dual-dictionary/common';
import { StudyListService } from '../services/study-list.service';
import { AddToStudyListDto } from '../dto/add-to-study-list.dto';
import { StudyListByDateDto } from '../dto/study-list-by-date.dto';
import { StudyListResponseDto } from '../dto/study-list-response.dto';

@ApiTags('study-list')
@Controller('study-list')
@ApiAuth()
export class StudyListController {
  constructor(private readonly studyListService: StudyListService) {}

  @Post()
  @Version('1')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a word to the study list',
    description:
      'Returns 409 with previous addedDates if the word is already saved. ' +
      'Send force=true to re-add (pushes a new date entry).',
  })
  async addWord(
    @CurrentUser('sub') userId: string,
    @Body() dto: AddToStudyListDto,
  ): Promise<StudyListResponseDto> {
    const entry = await this.studyListService.addWord(userId, dto);
    return StudyListResponseDto.from(entry);
  }

  @Get()
  @Version('1')
  @ApiOperation({
    summary: 'Get study list entries added on a specific date',
    description: 'Returns all words the authenticated user added on the given day.',
  })
  async getByDate(
    @CurrentUser('sub') userId: string,
    @Query() dto: StudyListByDateDto,
  ): Promise<StudyListResponseDto[]> {
    const entries = await this.studyListService.getByDate(
      userId,
      new Date(dto.date),
    );
    return entries.map(StudyListResponseDto.from);
  }
}
