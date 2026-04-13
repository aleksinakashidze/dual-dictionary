import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RolesEnum } from '@dual-dictionary/common';

export class ChangeRolesDto {
  @ApiProperty({ enum: RolesEnum, isArray: true })
  @IsEnum(RolesEnum, { each: true })
  roles: RolesEnum[];
}
