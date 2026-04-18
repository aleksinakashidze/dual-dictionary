import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateWordDto {
  @ApiPropertyOptional({ example: 'hello' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  word?: string;

  @ApiPropertyOptional({ example: 'გამარჯობა' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  translation?: string;
}
