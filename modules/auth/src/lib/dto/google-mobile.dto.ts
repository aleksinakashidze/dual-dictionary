import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class GoogleMobileDto {
  @ApiProperty({ description: 'Google ID token obtained by the native mobile client' })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}
