import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum } from 'class-validator';

export class RecoverAccountDto {
  @ApiProperty({
    description: 'Recovery token from the recovery email',
    example: 'abc123def456...',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Recovery mode: restore account or create new',
    enum: ['restore', 'new'],
    example: 'restore',
  })
  @IsEnum(['restore', 'new'])
  mode: 'restore' | 'new';
}
