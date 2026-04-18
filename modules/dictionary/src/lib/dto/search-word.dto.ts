import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { DirectionEnum } from '../enums/direction.enum';

export class SearchWordDto {
  @ApiProperty({ description: 'Search prefix (min 3 chars)', example: 'hel' })
  @IsString()
  @MinLength(3)
  q!: string;

  @ApiProperty({ enum: DirectionEnum })
  @IsEnum(DirectionEnum)
  direction!: DirectionEnum;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;
}
