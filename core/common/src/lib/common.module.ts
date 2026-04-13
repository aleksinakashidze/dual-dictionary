import {
  Global,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { MailService } from './mail/mail.service';
import { S3Service } from './storage/s3.service';
import { HashService } from './hash/hash.service';
import { RequestIdMiddleware } from './middlewares/request-id.middleware';
import { LanguageMiddleware } from './middlewares/language.middleware';

@Global()
@Module({
  providers: [MailService, S3Service, HashService],
  exports: [MailService, S3Service, HashService],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestIdMiddleware, LanguageMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
