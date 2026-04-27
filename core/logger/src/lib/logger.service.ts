import { Injectable, LoggerService, Optional, Scope } from '@nestjs/common';
import * as winston from 'winston';
import { AppConfigService } from '@dual-dictionary/config';

const { combine, timestamp, errors, colorize, printf, json } = winston.format;

@Injectable({ scope: Scope.DEFAULT })
export class AppLogger implements LoggerService {
  private readonly logger: winston.Logger;

  constructor(@Optional() private readonly config?: AppConfigService) {
    const isProd = config?.isProduction ?? process.env['NODE_ENV'] === 'production';

    this.logger = winston.createLogger({
      level: config?.logLevel ?? process.env['LOG_LEVEL'] ?? (isProd ? 'info' : 'debug'),
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        isProd
          ? json()
          : combine(
              colorize({ all: true }),
              printf(({ timestamp: ts, level, message, context, stack, ...meta }) => {
                const ctx = context ? `[${String(context)}] ` : '';
                const extra =
                  Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                return `${String(ts)} ${level}: ${ctx}${String(stack ?? message)}${extra}`;
              }),
            ),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
        }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
      ],
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }
}
