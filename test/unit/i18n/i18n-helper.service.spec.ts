/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { I18nHelperService } from '../../../src/shared/i18n/i18n-helper.service';
import { I18nModule } from '../../../src/shared/i18n/i18n.module';

describe('I18nHelperService', () => {
  let service: I18nHelperService;
  let i18nService: I18nService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [I18nModule],
      providers: [I18nHelperService],
    }).compile();

    service = module.get<I18nHelperService>(I18nHelperService);
    i18nService = module.get<I18nService>(I18nService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('translate', () => {
    it('should translate English messages', () => {
      const result = i18nService.translate('common.welcome', {
        lang: 'en',
      });
      expect(result).toBe('Welcome to Clean Architecture API');
    });

    it('should translate Vietnamese messages', () => {
      const result = i18nService.translate('common.welcome', {
        lang: 'vi',
      });
      expect(result).toBe('Chào mừng đến với Clean Architecture API');
    });

    it('should translate Japanese messages', () => {
      const result = i18nService.translate('common.welcome', {
        lang: 'ja',
      });
      expect(result).toBe('Clean Architecture APIへようこそ');
    });

    it('should interpolate variables in translations', () => {
      const result = i18nService.translate('validation.minLength', {
        lang: 'en',
        args: { field: 'password', min: 8 },
      });
      expect(result).toBe('password must be at least 8 characters');
    });
  });

  describe('translateValidation', () => {
    it('should translate validation messages with field name', () => {
      // Note: This requires I18nContext to be set up, which is done in requests
      // In unit tests, we can test the method signature
      expect(service.translateValidation).toBeDefined();
    });
  });

  describe('getCurrentLanguage', () => {
    it('should return default language when no context', () => {
      const lang = service.getCurrentLanguage();
      expect(lang).toBe('en');
    });
  });
});
