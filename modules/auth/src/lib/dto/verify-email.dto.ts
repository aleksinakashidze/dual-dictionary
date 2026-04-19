import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token from the verification link',
    example: 'abc123def456...',
  })
  @IsString()
  token: string;
}
