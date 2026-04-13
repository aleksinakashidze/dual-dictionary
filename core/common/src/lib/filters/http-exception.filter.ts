import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : ((exceptionResponse as Record<string, unknown>)['message'] ??
          exception.message);

    const errors =
      typeof exceptionResponse === 'object' &&
      Array.isArray((exceptionResponse as Record<string, unknown>)['message'])
        ? (exceptionResponse as Record<string, unknown>)['message']
        : undefined;

    const body = {
      success: false,
      statusCode: status,
      message,
      errors,
      path: request.url,
      requestId: request.headers['x-request-id'],
      timestamp: new Date().toISOString(),
    };

    this.logger.warn(`${request.method} ${request.url} → ${status}`);
    response.status(status).json(body);
  }
}
