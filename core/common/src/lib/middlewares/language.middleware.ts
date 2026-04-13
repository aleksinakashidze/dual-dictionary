import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LanguageEnum } from '../enums/language.enum';

export interface LangRequest extends Request {
  lang: LanguageEnum;
}

@Injectable()
export class LanguageMiddleware implements NestMiddleware {
  use(req: LangRequest, _res: Response, next: NextFunction): void {
    const raw =
      (req.headers['accept-language'] as string | undefined) ??
      (req.query['lang'] as string | undefined) ??
      LanguageEnum.English;

    const code = raw.split(',')[0].trim().split('-')[0].toLowerCase();
    req.lang = Object.values(LanguageEnum).includes(code as LanguageEnum)
      ? (code as LanguageEnum)
      : LanguageEnum.English;

    next();
  }
}
