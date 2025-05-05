
import { fixAbsoluteUrl, sanitizeApiUrl, extractApiPath } from '../urlSanitization';

describe('URL Sanitization utilities', () => {
  describe('fixAbsoluteUrl', () => {
    test('should keep absolute URLs as is', () => {
      expect(fixAbsoluteUrl('https://example.com/api')).toBe('https://example.com/api');
    });

    test('should prepend base URL to relative URLs', () => {
      const baseUrl = 'https://example.com';
      expect(fixAbsoluteUrl('/api/health', baseUrl)).toBe('https://example.com/api/health');
    });

    test('should handle empty URLs', () => {
      expect(fixAbsoluteUrl('')).toBe('');
    });
  });

  describe('sanitizeApiUrl', () => {
    test('should trim whitespace and remove null bytes', () => {
      expect(sanitizeApiUrl(' /api/health\0 ')).toBe('/api/health');
    });

    test('should remove javascript protocol', () => {
      expect(sanitizeApiUrl('javascript:alert(1)')).toBe(':alert(1)');
    });

    test('should convert absolute API URLs to relative', () => {
      // Mock the URL constructor
      global.URL = class {
        pathname: string;
        search: string;
        constructor(url: string) {
          this.pathname = '/api/health';
          this.search = '?param=value';
        }
      } as any;

      expect(sanitizeApiUrl('http://example.com/api/health?param=value')).toBe('/api/health?param=value');
    });
  });

  describe('extractApiPath', () => {
    test('should return relative paths as is', () => {
      expect(extractApiPath('/api/health')).toBe('/api/health');
    });

    test('should extract path from absolute API URLs', () => {
      // Mock the URL constructor
      global.URL = class {
        pathname: string;
        search: string;
        constructor(url: string) {
          this.pathname = '/api/health';
          this.search = '?param=value';
        }
      } as any;

      expect(extractApiPath('http://example.com/api/health?param=value')).toBe('/api/health?param=value');
    });
    
    test('should return original URL if not an API path', () => {
      expect(extractApiPath('http://example.com/not-api')).toBe('http://example.com/not-api');
    });
  });
});
