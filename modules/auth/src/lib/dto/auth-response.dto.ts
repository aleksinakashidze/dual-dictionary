import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from '@dual-dictionary/users';

export class TokensDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}

export class AuthResponseDto {
  @ApiProperty()
  user: UserResponseDto;

  @ApiProperty()
  tokens: TokensDto;
}
