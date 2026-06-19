import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePdfHighlightDto {
  @ApiPropertyOptional({
    description: 'Defaults to the PDF book title when omitted',
    maxLength: 180,
  })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;

  @ApiProperty({ maxLength: 5000 })
  @IsString()
  @MaxLength(5000)
  text!: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  page?: number;

  @ApiPropertyOptional({
    description: 'Client-side selection metadata for future anchoring',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  selection?: Record<string, unknown>;
}
