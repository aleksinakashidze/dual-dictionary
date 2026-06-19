import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UploadPdfBookDto {
  @ApiPropertyOptional({ description: 'Optional display title for the uploaded book' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  title?: string;
}
