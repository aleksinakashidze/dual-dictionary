import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto, RolesEnum } from '@dual-dictionary/common';

export class UserFilterDto extends PaginationDto {
  @ApiPropertyOptional({ enum: RolesEnum })
  @IsOptional()
  @IsEnum(RolesEnum)
  role?: RolesEnum;
}
