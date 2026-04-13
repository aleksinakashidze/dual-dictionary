import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { ConfigModule } from '@dual-dictionary/config';
import { LoggerModule } from '@dual-dictionary/logger';
import { DatabaseModule } from '@dual-dictionary/database';
import { CommonModule } from '@dual-dictionary/common';
import { I18nCoreModule } from '@dual-dictionary/i18n';
import { AuthModule } from '@dual-dictionary/auth';
import { UsersModule } from '@dual-dictionary/users';
import { HealthModule } from '@dual-dictionary/health';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    CommonModule,
    I18nCoreModule.forRoot(join(__dirname, 'i18n')),
    UsersModule,
    AuthModule,
    HealthModule,
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 100 },
      { name: 'strict',  ttl: 60_000, limit: 10  },
    ]),
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
