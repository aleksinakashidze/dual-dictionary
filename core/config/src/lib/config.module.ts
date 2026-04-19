import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envSchema } from './env.schema';
import { AppConfigService } from './app-config.service';

const env = process.env['NODE_ENV'] ?? 'development';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      // Load env-specific file first, fall back to .env
      envFilePath: [`.env.${env}`, '.env'],
      isGlobal: true,
      validationSchema: envSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule {}
