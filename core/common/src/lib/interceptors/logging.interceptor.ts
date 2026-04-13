import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = req;
    const userAgent = req.get('user-agent') ?? '';
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          const res = context.switchToHttp().getResponse<Response>();
          this.logger.log(
            `${method} ${url} ${res.statusCode} ${ms}ms — ${ip} ${userAgent}`,
          );
        },
        error: (err: Error) => {
          const ms = Date.now() - start;
          this.logger.error(`${method} ${url} ${ms}ms — ${err.message}`);
        },
      }),
    );
  }
}
