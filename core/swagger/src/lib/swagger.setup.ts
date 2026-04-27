import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export interface SwaggerConfig {
  title: string;
  description: string;
  version?: string;
  path?: string;
  serverUrl?: string;
  serverDescription?: string;
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
    .addServer(
      config.serverUrl ?? 'http://localhost:3000',
      config.serverDescription ?? 'API',
    );

  const document = SwaggerModule.createDocument(app, builder.build());

  SwaggerModule.setup(config.path ?? 'docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
