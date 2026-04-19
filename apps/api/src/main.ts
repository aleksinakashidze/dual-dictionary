import { NestFactory, Reflector } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app/app.module';
import { AppConfigService } from '@dual-dictionary/config';
import { AppLogger } from '@dual-dictionary/logger';
import { setupSwagger } from '@dual-dictionary/swagger';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
  JwtAuthGuard,
  LoggingInterceptor,
  ResponseInterceptor,
  RolesGuard,
  TimeoutInterceptor,
  globalValidationPipe,
} from '@dual-dictionary/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const config = app.get(AppConfigService);
  const logger = app.get(AppLogger);
  app.useLogger(logger);

  // Security
  app.use(helmet());
  app.use(cookieParser());
  app.use(compression());

  app.setGlobalPrefix('api');

  app.enableVersioning({ type: VersioningType.URI });

  app.enableCors({
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Accept-Language',
      'X-Request-Id',
    ],
    credentials: true,
  });

  app.useGlobalPipes(globalValidationPipe);
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TimeoutInterceptor(),
    new ResponseInterceptor(),
  );

  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector));

  if (!config.isProduction) {
    setupSwagger(app, {
      title: 'Dual Dictionary — API',
      description: 'English ↔ Georgian Dictionary REST API',
      path: 'docs',
    });
  }

  await app.listen(config.port, '0.0.0.0');
  logger.log(`API running on http://localhost:${config.port}/api`, 'Bootstrap');
  if (!config.isProduction) {
    logger.log(`Swagger at http://localhost:${config.port}/docs`, 'Bootstrap');
  }
}

bootstrap();
