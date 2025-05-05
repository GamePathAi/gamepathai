
/**
 * Helper utilities for internationalization
 */
import i18n from '../../lib/i18n';

/**
 * Ensure a string is internationalized
 * If key doesn't exist, returns the key itself
 */
export const t = (key: string, options?: Record<string, any>): string => {
  // If i18n is not initialized, return the key
  if (!i18n.isInitialized) {
    console.warn('i18n not initialized, returning raw key:', key);
    return key;
  }
  
  // Check if translation exists
  const hasTranslation = i18n.exists(key);
  if (!hasTranslation) {
    console.warn(`Missing translation key: ${key}`);
  }
  
  // Return the translation or the key itself if translation doesn't exist
  return i18n.t(key, options);
};

/**
 * Change the current language
 */
export const changeLanguage = async (lang: string): Promise<void> => {
  try {
    await i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  } catch (error) {
    console.error('Failed to change language:', error);
  }
};

/**
 * Get the current language
 */
export const getCurrentLanguage = (): string => {
  return i18n.language || 'en-US';
};

/**
 * Get all available languages
 */
export const getAvailableLanguages = (): { code: string, name: string }[] => {
  return [
    { code: 'en-US', name: 'English' },
    { code: 'es-ES', name: 'Español' },
    { code: 'pt-BR', name: 'Português' },
    { code: 'fr-FR', name: 'Français' },
    { code: 'de-DE', name: 'Deutsch' },
    { code: 'ru-RU', name: 'Русский' },
    { code: 'ja-JP', name: '日本語' },
    { code: 'ko-KR', name: '한국어' },
    { code: 'zh-CN', name: '中文' }
  ];
};

/**
 * Check if a language is fully translated
 */
export const isLanguageFullyTranslated = (lang: string): boolean => {
  // Get the number of translation keys in the default language (English)
  const defaultKeys = Object.keys(i18n.getDataByLanguage('en-US')?.translation || {}).length;
  
  // Get the number of translation keys in the specified language
  const langKeys = Object.keys(i18n.getDataByLanguage(lang)?.translation || {}).length;
  
  // A language is considered fully translated if it has at least 90% of the keys
  return langKeys / defaultKeys >= 0.9;
};

/**
 * Format a date according to the current locale
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat(getCurrentLanguage()).format(date);
};

/**
 * Format a number according to the current locale
 */
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat(getCurrentLanguage()).format(num);
};
