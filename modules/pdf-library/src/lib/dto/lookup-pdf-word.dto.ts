import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { DirectionEnum } from '@dual-dictionary/dictionary';

export class LookupPdfWordDto {
  @ApiProperty({ description: 'Selected word from the PDF reader' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  q!: string;

  @ApiPropertyOptional({
    enum: DirectionEnum,
    description: 'If omitted, the backend guesses by Georgian Unicode characters',
  })
  @IsOptional()
  @IsEnum(DirectionEnum)
  direction?: DirectionEnum;
}
