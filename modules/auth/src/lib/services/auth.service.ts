import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as crypto from 'crypto';
import { Profile } from 'passport-google-oauth20';
import { AppConfigService } from '@dual-dictionary/config';
import { HashService, JwtPayload, MailService } from '@dual-dictionary/common';
import { UserService, UserResponseDto } from '@dual-dictionary/users';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { ResendVerificationEmailDto } from '../dto/resend-verification-email.dto';
import { RecoverAccountDto } from '../dto/recover-account.dto';

const RESET_TOKEN_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const EMAIL_VERIFICATION_TOKEN_EXPIRY_MS = 1 * 60 * 60 * 1000; // 1 hour
const ACCOUNT_RECOVERY_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AuthResult {
  user: UserResponseDto;
  tokens: { accessToken: string; refreshToken: string };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly hash: HashService,
    private readonly mail: MailService,
    private readonly config: AppConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    // Check if email was used by a deleted account
    const deletedUser = await this.userService.findDeletedByEmail(dto.email);
    if (deletedUser) {
      // Fire-and-forget: do not block the HTTP response on email delivery
      this.sendAccountRecoveryEmailAsync(
        deletedUser._id.toString(),
        deletedUser.email,
        deletedUser.firstName,
      ).catch((err) =>
        this.logger.error(`Failed to send recovery email to ${deletedUser.email}`, err),
      );

      throw new ConflictException(
        'This email was previously registered. Check your inbox for account recovery options.',
      );
    }

    const user = await this.userService.create(dto);
    const tokens = await this.generateTokens(user._id.toString(), user.username, user.roles);
    await this.userService.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    // Send email verification email (async, non-blocking)
    this.sendVerificationEmailAsync(user._id.toString(), user.email, user.firstName).catch((err) =>
      this.logger.error(`Failed to send verification email to ${user.email}`, err),
    );

    return { user: UserResponseDto.from(user), tokens };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.userService.findByEmailWithPassword(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    if (!user.password) throw new UnauthorizedException('This account uses Google sign-in');

    const passwordMatch = await this.hash.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new ForbiddenException('Account is deactivated');

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Email not verified. Please verify your email before logging in.');
    }

    const tokens = await this.generateTokens(user._id.toString(), user.username, user.roles);
    await this.userService.updateRefreshToken(user._id.toString(), tokens.refreshToken);
    return { user: UserResponseDto.from(user), tokens };
  }

  async refreshTokens(userId: string, rawRefreshToken: string): Promise<AuthResult> {
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

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.userService.findByEmail(dto.email);

    // Always respond the same way — don't reveal whether the email exists
    if (!user || !user.isActive) {
      this.logger.log(`Password reset requested for unknown/inactive email: ${dto.email}`);
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

    await this.userService.storeResetToken(user._id.toString(), hashedToken, expiry);

    const resetUrl = `${this.config.webAppUrl}/auth/reset-password?token=${rawToken}`;

    try {
      await this.mail.sendMail({
        to: user.email,
        subject: 'Password Reset Request',
        html: this.buildResetEmail(user.firstName, resetUrl),
        text: `Reset your password: ${resetUrl}\n\nThis link expires in 30 minutes.`,
      });
      this.logger.log(`Password reset email sent to: ${user.email}`);
    } catch (err) {
      // Log but never expose mail errors to the client — the token is already stored
      this.logger.error(`Failed to send reset email to ${user.email}`, err);
    }
  }

  async validateResetToken(rawToken: string): Promise<void> {
    const user = await this.findUserByRawResetToken(rawToken);
    if (!user) throw new BadRequestException('Invalid or expired reset token');
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.findUserByRawResetToken(dto.token);
    if (!user) throw new BadRequestException('Invalid or expired reset token');

    const id = user._id.toString();
    await Promise.all([
      this.userService.updatePassword(id, dto.password),
      this.userService.clearResetToken(id),
      this.userService.updateRefreshToken(id, null), // invalidate all sessions
    ]);

    this.logger.log(`Password successfully reset for user: ${user.email}`);
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const user = await this.findUserByRawVerificationToken(dto.token);
    if (!user) throw new BadRequestException('Invalid or expired verification token');

    const id = user._id.toString();
    await this.userService.markEmailAsVerified(id);
    this.logger.log(`Email verified for user: ${user.email}`);
  }

  async resendVerificationEmail(dto: ResendVerificationEmailDto): Promise<void> {
    const user = await this.userService.findByEmail(dto.email);

    // Always respond the same way — don't reveal whether the email exists
    if (!user || !user.isActive) {
      this.logger.log(`Verification email resend requested for unknown/inactive email: ${dto.email}`);
      return;
    }

    // If already verified, silently return
    if (user.isEmailVerified) {
      this.logger.log(`Verification email resend requested for already verified email: ${dto.email}`);
      return;
    }

    // Send new verification email (async, non-blocking)
    this.sendVerificationEmailAsync(user._id.toString(), user.email, user.firstName).catch((err) =>
      this.logger.error(`Failed to resend verification email to ${user.email}`, err),
    );
  }

  private async sendVerificationEmailAsync(
    userId: string,
    email: string,
    firstName: string,
  ): Promise<void> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_EXPIRY_MS);

    await this.userService.storeVerificationToken(userId, hashedToken, expiry);

    const verifyUrl = `${this.config.webAppUrl}/auth/verify-email?token=${rawToken}`;

    try {
      await this.mail.sendMail({
        to: email,
        subject: 'Verify Your Email Address',
        html: this.buildVerificationEmail(firstName, verifyUrl),
        text: `Verify your email: ${verifyUrl}\n\nThis link expires in 1 hour.`,
      });
      this.logger.log(`Verification email sent to: ${email}`);
    } catch (err) {
      // Log but never expose mail errors to the client — the token is already stored
      this.logger.error(`Failed to send verification email to ${email}`, err);
    }
  }

  private findUserByRawResetToken(rawToken: string) {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    return this.userService.findByHashedResetToken(hashedToken);
  }

  private findUserByRawVerificationToken(rawToken: string) {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    return this.userService.findByHashedVerificationToken(hashedToken);
  }

  private buildResetEmail(firstName: string, resetUrl: string): string {
    return `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">Password Reset</h2>
        <p>Hi ${firstName},</p>
        <p>We received a request to reset your Dual Dictionary password.</p>
        <p>Click the button below to set a new password. This link is valid for <strong>30 minutes</strong>.</p>
        <a href="${resetUrl}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;
                  background:#4361ee;color:#fff;border-radius:8px;
                  text-decoration:none;font-weight:600">
          Reset Password
        </a>
        <p style="color:#64748b;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#64748b;font-size:13px">— Dual Dictionary Team</p>
      </div>`;
  }

  private buildVerificationEmail(firstName: string, verifyUrl: string): string {
    return `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">Verify Your Email</h2>
        <p>Hi ${firstName},</p>
        <p>Welcome to Dual Dictionary! Please verify your email address to complete your registration.</p>
        <p>Click the button below to verify your email. This link is valid for <strong>1 hour</strong>.</p>
        <a href="${verifyUrl}"
           style="display:inline-block;margin:16px 0;padding:12px 24px;
                  background:#10b981;color:#fff;border-radius:8px;
                  text-decoration:none;font-weight:600">
          Verify Email
        </a>
        <p style="color:#64748b;font-size:13px">If you didn't create this account, you can safely ignore this email.</p>
        <p style="color:#64748b;font-size:13px">— Dual Dictionary Team</p>
      </div>`;
  }

  private buildAccountRecoveryEmail(firstName: string, restoreUrl: string, newUrl: string): string {
    return `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
        <h2 style="color:#1e293b">Account Recovery</h2>
        <p>Hi ${firstName},</p>
        <p>Someone tried to create a new account with your email address. Your previous Dual Dictionary account appears to have been deleted.</p>
        <p style="margin-top:20px;font-weight:600">What would you like to do?</p>
        <div style="margin:16px 0;padding:12px;background:#f0fdf4;border-radius:8px;border-left:4px solid #10b981">
          <p style="margin:0 0 8px 0;font-weight:600">Option 1: Restore Your Account</p>
          <p style="margin:0 0 12px 0;font-size:13px;color:#4b5563">Get back your account with all previous data. You'll need to set a new password.</p>
          <a href="${restoreUrl}"
             style="display:inline-block;padding:10px 20px;background:#10b981;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
            Restore Account
          </a>
        </div>
        <div style="margin:16px 0;padding:12px;background:#fef3c7;border-radius:8px;border-left:4px solid #f59e0b">
          <p style="margin:0 0 8px 0;font-weight:600">Option 2: Create New Account</p>
          <p style="margin:0 0 12px 0;font-size:13px;color:#4b5563">Create a fresh account with this email. The old account and its data will be permanently deleted.</p>
          <a href="${newUrl}"
             style="display:inline-block;padding:10px 20px;background:#f59e0b;color:#fff;border-radius:6px;text-decoration:none;font-weight:600">
            Create New Account
          </a>
        </div>
        <p style="color:#64748b;font-size:13px;margin-top:20px">Links expire in <strong>24 hours</strong>.</p>
        <p style="color:#64748b;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        <p style="color:#64748b;font-size:13px">— Dual Dictionary Team</p>
      </div>`;
  }

  private async generateTokens(
    userId: string,
    username: string,
    roles: string[],
  ): Promise<AuthResult['tokens']> {
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

  async recoverAccount(dto: RecoverAccountDto): Promise<AuthResult | null> {
    const hashedToken = crypto.createHash('sha256').update(dto.token).digest('hex');
    const user = await this.userService.findByHashedRecoveryToken(hashedToken);

    if (!user || !user.recoveryTokenExpiry || new Date() > user.recoveryTokenExpiry) {
      throw new BadRequestException(
        'Invalid or expired recovery link. Please try registering again.',
      );
    }

    if (dto.mode === 'restore') {
      // Restore the deleted account
      await this.userService.recoverAccount(user._id.toString());
      
      // Generate tokens for immediate login
      const tokens = await this.generateTokens(user._id.toString(), user.username, user.roles);
      await this.userService.updateRefreshToken(user._id.toString(), tokens.refreshToken);

      // Clear recovery token
      await this.userService.clearRecoveryToken(user._id.toString());

      return { user: UserResponseDto.from(user), tokens };
    } else {
      // Clear recovery token first, then hard-delete (user must exist for clearRecoveryToken)
      await this.userService.clearRecoveryToken(user._id.toString());
      await this.userService.permanentlyDeleteUser(user._id.toString());

      return null;
    }
  }

  async loginWithGoogle(profile: Profile): Promise<AuthResult> {
    const googleId = profile.id;
    const email = profile.emails?.[0]?.value ?? '';
    const firstName = profile.name?.givenName ?? 'User';
    const lastName = profile.name?.familyName ?? '';

    const user = await this.userService.findOrCreateByGoogle({ googleId, email, firstName, lastName });

    const tokens = await this.generateTokens(user._id.toString(), user.username, user.roles);
    await this.userService.updateRefreshToken(user._id.toString(), tokens.refreshToken);
    return { user: UserResponseDto.from(user), tokens };
  }

  async loginWithGoogleIdToken(idToken: string): Promise<AuthResult> {
    interface GoogleTokenInfo {
      sub: string;
      email: string;
      given_name?: string;
      family_name?: string;
      aud: string;
    }

    let info: GoogleTokenInfo;
    try {
      const { data } = await axios.get<GoogleTokenInfo>(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
      );
      info = data;
    } catch {
      throw new UnauthorizedException('Invalid Google ID token');
    }

    if (info.aud !== this.config.googleClientId) {
      throw new UnauthorizedException('Google token audience mismatch');
    }

    const user = await this.userService.findOrCreateByGoogle({
      googleId: info.sub,
      email: info.email ?? '',
      firstName: info.given_name ?? 'User',
      lastName: info.family_name ?? '',
    });

    const tokens = await this.generateTokens(user._id.toString(), user.username, user.roles);
    await this.userService.updateRefreshToken(user._id.toString(), tokens.refreshToken);
    return { user: UserResponseDto.from(user), tokens };
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userService.findById(userId);
    return UserResponseDto.from(user);
  }

  private async sendAccountRecoveryEmailAsync(
    userId: string,
    email: string,
    firstName: string,
  ): Promise<void> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + ACCOUNT_RECOVERY_TOKEN_EXPIRY_MS);

    await this.userService.storeRecoveryToken(userId, hashedToken, expiry);

    const baseUrl = this.config.webAppUrl;
    const restoreUrl = `${baseUrl}/auth/account-recovery?token=${rawToken}&mode=restore`;
    const newUrl = `${baseUrl}/auth/account-recovery?token=${rawToken}&mode=new`;

    await this.mail.sendMail({
      to: email,
      subject: 'Account Recovery - Dual Dictionary',
      html: this.buildAccountRecoveryEmail(firstName, restoreUrl, newUrl),
    });

    this.logger.log(`Account recovery email sent to: ${email}`);
  }
}

