import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { Profile } from 'passport-google-oauth20';
import {
  ApiAuth,
  CurrentUser,
  JwtPayload,
  Public,
  Throttle,
} from '@dual-dictionary/common';
import { AppConfigService } from '@dual-dictionary/config';
import { UserResponseDto } from '@dual-dictionary/users';
import { RefreshTokenGuard } from '../guards/refresh-token.guard';
import { JwtRefreshPayload } from '../strategies/jwt-refresh.strategy';
import { AuthService, AuthResult } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { ResendVerificationEmailDto } from '../dto/resend-verification-email.dto';
import { RecoverAccountDto } from '../dto/recover-account.dto';
import { GoogleMobileDto } from '../dto/google-mobile.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfigService,
  ) {}

  private toResponse(result: AuthResult, res: Response): AuthResponseDto {
    this.authService.setRefreshTokenCookie(res, result.tokens.refreshToken);
    return {
      user: result.user,
      tokens: {
        accessToken: result.tokens.accessToken,
        // Also returned in the body so native clients can store it without cookie access
        refreshToken: result.tokens.refreshToken,
      },
    };
  }

  @Post('register')
  @Version('1')
  @Public()
  @Throttle({ strict: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register a new user' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.toResponse(await this.authService.register(dto), res);
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
    return this.toResponse(await this.authService.login(dto), res);
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
    return this.toResponse(
      await this.authService.refreshTokens(user.sub, user.refreshToken),
      res,
    );
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

  @Get('me')
  @Version('1')
  @ApiAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.authService.getProfile(user.sub);
  }

  @Get('google')
  @Version('1')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  googleLogin(): void {
    if (!this.config.googleClientId) {
      throw new ServiceUnavailableException('Google OAuth is not configured');
    }
    // Passport redirects to Google — no body needed
  }

  @Post('google/mobile')
  @Version('1')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ strict: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Google OAuth for native mobile clients — exchange ID token for app JWT' })
  async googleMobile(
    @Body() dto: GoogleMobileDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    return this.toResponse(await this.authService.loginWithGoogleIdToken(dto.idToken), res);
  }

  @Get('google/callback')
  @Version('1')
  @Public()
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(
    @Req() req: Request & { user: Profile },
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.authService.loginWithGoogle(req.user);
    this.authService.setRefreshTokenCookie(res, result.tokens.refreshToken);
    // Deliver the access token via a short-lived non-httpOnly cookie so the
    // frontend JS can read it once without the token ever appearing in the URL
    // (URL tokens leak into server logs, browser history, and referrer headers).
    res.cookie('_auth_tmp', result.tokens.accessToken, {
      httpOnly: false,
      secure: this.config.isProduction,
      sameSite: 'strict',
      maxAge: 60_000,
    });
    res.redirect(`${this.config.webAppUrl}/auth/google/callback`);
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
    return this.toResponse(result, res);
  }
}

