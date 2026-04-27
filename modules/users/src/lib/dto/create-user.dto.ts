import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { RolesEnum } from '@dual-dictionary/common';
import { BaseUserDto } from './base-user.dto';

export class CreateUserDto extends BaseUserDto {
  @ApiPropertyOptional({ enum: RolesEnum, isArray: true })
  @IsOptional()
  @IsEnum(RolesEnum, { each: true })
  roles?: RolesEnum[];
}
