import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DirectionEnum } from '@dual-dictionary/dictionary';

export class AddToStudyListDto {
  @ApiProperty({ description: 'Word document _id from the dictionary collection' })
  @IsString()
  @IsNotEmpty()
  wordId!: string;

  @ApiProperty({ enum: DirectionEnum })
  @IsEnum(DirectionEnum)
  direction!: DirectionEnum;

  @ApiPropertyOptional({
    description: 'Set true to re-add a word that already exists (adds a new date entry)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
