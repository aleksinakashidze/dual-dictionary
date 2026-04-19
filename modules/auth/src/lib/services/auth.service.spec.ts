import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { UserService } from '@dual-dictionary/users';
import { HashService, MailService } from '@dual-dictionary/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfigService } from '@dual-dictionary/config';

const mockUser = (overrides = {}) => ({
  _id: { toString: () => 'user-id-1' },
  email: 'test@example.com',
  firstName: 'Test',
  isActive: true,
  ...overrides,
});

describe('AuthService — password reset', () => {
  let authService: AuthService;
  let userService: jest.Mocked<UserService>;
  let mailService: jest.Mocked<MailService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            findByHashedResetToken: jest.fn(),
            storeResetToken: jest.fn(),
            clearResetToken: jest.fn(),
            updatePassword: jest.fn(),
            updateRefreshToken: jest.fn(),
          },
        },
        { provide: JwtService, useValue: { signAsync: jest.fn().mockResolvedValue('token') } },
        { provide: HashService, useValue: { hash: jest.fn(), compare: jest.fn() } },
        { provide: MailService, useValue: { sendMail: jest.fn() } },
        {
          provide: AppConfigService,
          useValue: {
            isProduction: false,
            jwtSecret: 'secret',
            jwtExpiresIn: '1h',
            jwtRefreshSecret: 'refresh-secret',
            jwtRefreshExpiresIn: '7d',
            webAppUrl: 'http://localhost:4200',
            mailFrom: 'noreply@test.com',
          },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    userService = module.get(UserService);
    mailService = module.get(MailService);
  });

  describe('forgotPassword', () => {
    it('sends reset email for valid active user', async () => {
      userService.findByEmail.mockResolvedValue(mockUser() as any);
      userService.storeResetToken.mockResolvedValue(undefined);
      mailService.sendMail.mockResolvedValue(undefined);

      await authService.forgotPassword({ email: 'test@example.com' });

      expect(userService.storeResetToken).toHaveBeenCalledWith(
        'user-id-1',
        expect.any(String),
        expect.any(Date),
      );
      expect(mailService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'test@example.com' }),
      );
    });

    it('does nothing silently when email not found (no enumeration)', async () => {
      userService.findByEmail.mockResolvedValue(null);

      await expect(authService.forgotPassword({ email: 'ghost@example.com' })).resolves.toBeUndefined();
      expect(mailService.sendMail).not.toHaveBeenCalled();
    });

    it('does nothing silently for inactive user', async () => {
      userService.findByEmail.mockResolvedValue(mockUser({ isActive: false }) as any);

      await authService.forgotPassword({ email: 'test@example.com' });
      expect(mailService.sendMail).not.toHaveBeenCalled();
    });
  });

  describe('validateResetToken', () => {
    it('resolves for a valid token', async () => {
      userService.findByHashedResetToken.mockResolvedValue(mockUser() as any);
      await expect(authService.validateResetToken('raw-token')).resolves.toBeUndefined();
    });

    it('throws BadRequestException for invalid/expired token', async () => {
      userService.findByHashedResetToken.mockResolvedValue(null);
      await expect(authService.validateResetToken('bad-token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('resetPassword', () => {
    it('updates password and clears token on success', async () => {
      userService.findByHashedResetToken.mockResolvedValue(mockUser() as any);
      userService.updatePassword.mockResolvedValue(undefined);
      userService.clearResetToken.mockResolvedValue(undefined);
      userService.updateRefreshToken.mockResolvedValue(undefined);

      await authService.resetPassword({ token: 'raw-token', password: 'NewPass1!' });

      expect(userService.updatePassword).toHaveBeenCalledWith('user-id-1', 'NewPass1!');
      expect(userService.clearResetToken).toHaveBeenCalledWith('user-id-1');
      expect(userService.updateRefreshToken).toHaveBeenCalledWith('user-id-1', null);
    });

    it('throws BadRequestException for invalid token', async () => {
      userService.findByHashedResetToken.mockResolvedValue(null);
      await expect(
        authService.resetPassword({ token: 'bad-token', password: 'NewPass1!' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('generates consistent token hash', () => {
      const raw = crypto.randomBytes(32).toString('hex');
      const hash1 = crypto.createHash('sha256').update(raw).digest('hex');
      const hash2 = crypto.createHash('sha256').update(raw).digest('hex');
      expect(hash1).toBe(hash2);
    });
  });
});
