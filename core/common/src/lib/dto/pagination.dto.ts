import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { LanguageEnum } from '../enums/language.enum';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: LanguageEnum, default: LanguageEnum.English })
  @IsOptional()
  @IsEnum(LanguageEnum)
  lang?: LanguageEnum = LanguageEnum.English;
}

export class PageResultDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  static from<T>(result: {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }): PageResultDto<T> {
    const dto = new PageResultDto<T>();
    Object.assign(dto, result);
    return dto;
  }
}
