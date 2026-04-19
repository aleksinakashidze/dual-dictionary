import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
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
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { ResendVerificationEmailDto } from '../dto/resend-verification-email.dto';
import { RecoverAccountDto } from '../dto/recover-account.dto';

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

  @Post('forgot-password')
  @Version('1')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ strict: { limit: 3, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Request a password reset link',
    description: 'Sends a reset email if the address is registered. Always returns 204 to prevent email enumeration.',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(dto);
  }

  @Get('validate-reset-token')
  @Version('1')
  @Public()
  @Throttle({ strict: { limit: 10, ttl: 60_000 } })
  @ApiQuery({ name: 'token', required: true })
  @ApiOperation({ summary: 'Validate a password reset token' })
  async validateResetToken(@Query('token') token: string): Promise<void> {
    await this.authService.validateResetToken(token);
  }

  @Post('reset-password')
  @Version('1')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ strict: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Reset password using a valid token' })
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto);
  }

  @Post('verify-email')
  @Version('1')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ strict: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Verify email address using verification token',
    description: 'Activates the email verification for the user account.',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto): Promise<void> {
    await this.authService.verifyEmail(dto);
  }

  @Post('resend-verification-email')
  @Version('1')
  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ strict: { limit: 3, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Resend verification email',
    description: 'Sends a new verification link to the specified email. Always returns 204 to prevent email enumeration.',
  })
  async resendVerificationEmail(@Body() dto: ResendVerificationEmailDto): Promise<void> {
    await this.authService.resendVerificationEmail(dto);
  }

  @Post('account-recovery')
  @Version('1')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ strict: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Recover a deleted account',
    description: 'Restore (200 + tokens) or permanently delete (204) a previously deleted account.',
  })
  async recoverAccount(
    @Body() dto: RecoverAccountDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto | null> {
    const result = await this.authService.recoverAccount(dto);
    if (!result) {
      res.status(HttpStatus.NO_CONTENT);
      return null;
    }
    return result;
  }
}

