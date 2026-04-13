import { ValidationPipe } from '@nestjs/common';

/**
 * Pre-configured global validation pipe:
 * - strips unknown properties (whitelist)
 * - throws on unknown properties (forbidNonWhitelisted)
 * - auto-transforms plain objects to class instances
 * - returns 422 Unprocessable Entity on validation errors
 */
export const globalValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
  errorHttpStatusCode: 422,
});
