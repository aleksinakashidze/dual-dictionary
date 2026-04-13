import { DynamicModule, Module } from '@nestjs/common';
import {
  I18nModule as NestI18nModule,
  AcceptLanguageResolver,
  QueryResolver,
} from 'nestjs-i18n';
import { join } from 'path';

@Module({})
export class I18nCoreModule {
  static forRoot(i18nPath: string): DynamicModule {
    return {
      module: I18nCoreModule,
      imports: [
        NestI18nModule.forRoot({
          fallbackLanguage: 'en',
          loaderOptions: {
            path: i18nPath,
            watch: false,
          },
          resolvers: [
            { use: QueryResolver, options: ['lang'] },
            AcceptLanguageResolver,
          ],
          typesOutputPath:
            process.env['NODE_ENV'] !== 'production'
              ? join(
                  process.cwd(),
                  'core/i18n/src/lib/generated/i18n.generated.ts',
                )
              : undefined,
        }),
      ],
      exports: [NestI18nModule],
    };
  }
}
