import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { LanguageEnum } from '../enums/language.enum';

/** Extract the language from Accept-Language header or ?lang= query param */
export const Language = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): LanguageEnum => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const raw =
      (req.headers['accept-language'] as string | undefined) ??
      (req.query['lang'] as string | undefined) ??
      LanguageEnum.English;

    const trimmed = raw.split(',')[0].trim().split('-')[0].toLowerCase();
    return Object.values(LanguageEnum).includes(trimmed as LanguageEnum)
      ? (trimmed as LanguageEnum)
      : LanguageEnum.English;
  },
);
