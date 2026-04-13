import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AppConfigService } from '@dual-dictionary/config';
import { JwtPayload } from '@dual-dictionary/common';

export interface JwtRefreshPayload extends JwtPayload {
  refreshToken: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: AppConfigService) {
    super({
      // Accept from Authorization header OR from cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          (req?.cookies as Record<string, string>)?.['refresh_token'] ?? null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.jwtRefreshSecret,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtPayload): JwtRefreshPayload {
    if (!payload?.sub) throw new UnauthorizedException('Invalid refresh token');

    const refreshToken =
      (req?.cookies as Record<string, string>)?.['refresh_token'] ??
      req.get('Authorization')?.replace('Bearer ', '').trim() ??
      '';

    return { ...payload, refreshToken };
  }
}
