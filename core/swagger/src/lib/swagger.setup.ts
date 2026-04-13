import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export interface SwaggerConfig {
  title: string;
  description: string;
  version?: string;
  path?: string;
}

export function setupSwagger(
  app: INestApplication,
  config: SwaggerConfig,
): void {
  const builder = new DocumentBuilder()
    .setTitle(config.title)
    .setDescription(config.description)
    .setVersion(config.version ?? '1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
      },
      'access-token',
    )
    .addServer('http://localhost:3000', 'Local API')
    .addServer('http://localhost:3001', 'Local Admin API');

  const document = SwaggerModule.createDocument(app, builder.build());

  SwaggerModule.setup(config.path ?? 'docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
