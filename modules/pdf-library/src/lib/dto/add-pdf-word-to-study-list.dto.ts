import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsMongoId, IsOptional } from 'class-validator';
import { DirectionEnum } from '@dual-dictionary/dictionary';

export class AddPdfWordToStudyListDto {
  @ApiProperty({ description: 'Word document _id from the dictionary collection' })
  @IsMongoId()
  wordId!: string;

  @ApiProperty({ enum: DirectionEnum })
  @IsEnum(DirectionEnum)
  direction!: DirectionEnum;

  @ApiPropertyOptional({
    description: 'Defaults to true for PDF reader additions so every reading event is recorded',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
