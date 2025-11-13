import { Module } from '@nestjs/common';
import {
  I18nModule as NestI18nModule,
  AcceptLanguageResolver,
  HeaderResolver,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';
import { I18nHelperService } from './i18n-helper.service';

/**
 * I18nModule - Internationalization support
 *
 * Supports multiple languages: English (en), Vietnamese (vi), Japanese (ja)
 * Language detection order:
 * 1. Query parameter: ?lang=en
 * 2. Custom header: x-custom-lang
 * 3. Accept-Language header
 * 4. Default fallback: en
 */
@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, 'translations/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] }, // ?lang=en
        { use: HeaderResolver, options: ['x-custom-lang'] }, // Custom header
        AcceptLanguageResolver, // Accept-Language header
      ],
    }),
  ],
  providers: [I18nHelperService],
  exports: [NestI18nModule, I18nHelperService],
})
export class I18nModule {}
