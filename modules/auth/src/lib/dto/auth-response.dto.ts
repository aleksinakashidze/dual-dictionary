import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '@dual-dictionary/users';

export class TokensDto {
  @ApiProperty()
  accessToken: string;

  @ApiPropertyOptional({ description: 'Included for native-app clients; web clients use the httpOnly cookie instead.' })
  refreshToken?: string;
}

export class AuthResponseDto {
  @ApiProperty()
  user: UserResponseDto;

  @ApiProperty()
  tokens: TokensDto;
}
