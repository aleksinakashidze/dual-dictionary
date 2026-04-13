import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import {
  ApiAuth,
  CurrentUser,
  JwtPayload,
  Public,
  Throttle,
} from '@dual-dictionary/common';
import { RefreshTokenGuard } from '../guards/refresh-token.guard';
import { JwtRefreshPayload } from '../strategies/jwt-refresh.strategy';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Version('1')
  @Public()
  @Throttle({ strict: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register a new user' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.register(dto);
    this.authService.setRefreshTokenCookie(res, result.tokens.refreshToken);
    return result;
  }

  @Post('login')
  @Version('1')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ strict: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.login(dto);
    this.authService.setRefreshTokenCookie(res, result.tokens.refreshToken);
    return result;
  }

  @Post('refresh')
  @Version('1')
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(
    @CurrentUser() user: JwtRefreshPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.refreshTokens(
      user.sub,
      user.refreshToken,
    );
    this.authService.setRefreshTokenCookie(res, result.tokens.refreshToken);
    return result;
  }

  @Post('logout')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(
    @CurrentUser() user: JwtPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    await this.authService.logout(user.sub);
    this.authService.clearRefreshTokenCookie(res);
  }
}
