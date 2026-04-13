import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { AppConfigService } from '@dual-dictionary/config';
import { HashService, JwtPayload } from '@dual-dictionary/common';
import { UserService, UserResponseDto } from '@dual-dictionary/users';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto, TokensDto } from '../dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly hash: HashService,
    private readonly config: AppConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.userService.create(dto);
    const tokens = await this.generateTokens(user._id.toString(), user.username, user.roles);
    await this.userService.updateRefreshToken(user._id.toString(), tokens.refreshToken);
    return { user: UserResponseDto.from(user), tokens };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userService.findByEmailWithPassword(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordMatch = await this.hash.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new ForbiddenException('Account is deactivated');

    const tokens = await this.generateTokens(user._id.toString(), user.username, user.roles);
    await this.userService.updateRefreshToken(user._id.toString(), tokens.refreshToken);
    return { user: UserResponseDto.from(user), tokens };
  }

  async refreshTokens(userId: string, rawRefreshToken: string): Promise<AuthResponseDto> {
    const user = await this.userService.findByIdWithRefreshToken(userId);
    if (!user?.refreshToken) throw new ForbiddenException('Access denied');

    const tokenMatch = await this.hash.compare(rawRefreshToken, user.refreshToken);
    if (!tokenMatch) throw new ForbiddenException('Access denied');

    const tokens = await this.generateTokens(user._id.toString(), user.username, user.roles);
    await this.userService.updateRefreshToken(user._id.toString(), tokens.refreshToken);
    return { user: UserResponseDto.from(user), tokens };
  }

  async logout(userId: string): Promise<void> {
    await this.userService.updateRefreshToken(userId, null);
  }

  setRefreshTokenCookie(res: Response, token: string): void {
    res.cookie('refresh_token', token, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refresh_token');
  }

  private async generateTokens(
    userId: string,
    username: string,
    roles: string[],
  ): Promise<TokensDto> {
    const payload: JwtPayload = { sub: userId, username, roles };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.jwtSecret,
        expiresIn: this.config.jwtExpiresIn as never,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.jwtRefreshSecret,
        expiresIn: this.config.jwtRefreshExpiresIn as never,
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
