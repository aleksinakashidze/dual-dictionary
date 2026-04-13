import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService) {}

  get nodeEnv(): string {
    return this.config.get<string>('NODE_ENV', 'development');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get port(): number {
    return this.config.get<number>('PORT', 3000);
  }

  get adminPort(): number {
    return this.config.get<number>('ADMIN_PORT', 3001);
  }

  get mongoUri(): string {
    return this.config.getOrThrow<string>('MONGODB_URI');
  }

  get jwtSecret(): string {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }

  get jwtExpiresIn(): string {
    return this.config.get<string>('JWT_EXPIRES_IN', '1h');
  }

  get jwtRefreshSecret(): string {
    return this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  get jwtRefreshExpiresIn(): string {
    return this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }

  get corsOrigins(): string[] {
    return this.config
      .get<string>('CORS_ORIGINS', 'http://localhost:4200')
      .split(',')
      .map((o) => o.trim());
  }

  get mailHost(): string | undefined {
    return this.config.get<string>('MAIL_HOST');
  }

  get mailPort(): number {
    return this.config.get<number>('MAIL_PORT', 587);
  }

  get mailUser(): string | undefined {
    return this.config.get<string>('MAIL_USER');
  }

  get mailPass(): string | undefined {
    return this.config.get<string>('MAIL_PASS');
  }

  get mailFrom(): string {
    return this.config.get<string>('MAIL_FROM', 'noreply@example.com');
  }

  get awsRegion(): string | undefined {
    return this.config.get<string>('AWS_REGION');
  }

  get awsAccessKeyId(): string | undefined {
    return this.config.get<string>('AWS_ACCESS_KEY_ID');
  }

  get awsSecretAccessKey(): string | undefined {
    return this.config.get<string>('AWS_SECRET_ACCESS_KEY');
  }

  get awsS3Bucket(): string | undefined {
    return this.config.get<string>('AWS_S3_BUCKET');
  }
}
