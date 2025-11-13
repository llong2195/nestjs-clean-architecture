import { Injectable } from '@nestjs/common';
import { I18nService, I18nContext } from 'nestjs-i18n';

/**
 * I18nHelperService - Helper service for internationalization
 *
 * Provides convenient methods for translating messages in services and use cases.
 * Uses the current request's language from I18nContext.
 */
@Injectable()
export class I18nHelperService {
  constructor(private readonly i18n: I18nService) {}

  /**
   * Translate a key with optional arguments
   * @param key - Translation key (e.g., 'user.created')
   * @param args - Optional arguments for interpolation
   * @returns Translated string
   */
  translate(key: string, args?: Record<string, unknown>): string {
    const lang = I18nContext.current()?.lang || 'en';
    return this.i18n.translate(key, {
      lang,
      args,
    });
  }

  /**
   * Translate a validation error message
   * @param constraint - Validation constraint name (e.g., 'isString')
   * @param field - Field name
   * @param args - Optional additional arguments
   * @returns Translated validation error message
   */
  translateValidation(constraint: string, field: string, args?: Record<string, unknown>): string {
    return this.translate(`validation.${constraint}`, {
      field,
      ...args,
    });
  }

  /**
   * Get the current language from context
   * @returns Current language code (e.g., 'en', 'vi', 'ja')
   */
  getCurrentLanguage(): string {
    return I18nContext.current()?.lang || 'en';
  }
}
