
import { isUrlSafe, isCorsOrRedirectError } from '../url-safety';

// Mock the isTrustedDomain function since we're testing it separately
jest.mock('../redirectDetection', () => ({
  isTrustedDomain: (url: string) => {
    return url.includes('trusted') || url.startsWith('/') || url.startsWith('#');
  }
}));

describe('URL Safety utilities', () => {
  describe('isUrlSafe', () => {
    test('should consider relative URLs safe', () => {
      expect(isUrlSafe('/api/health')).toBe(true);
      expect(isUrlSafe('#section')).toBe(true);
    });

    test('should consider trusted domains safe', () => {
      expect(isUrlSafe('https://trusted-domain.com')).toBe(true);
    });

    test('should consider URLs with suspicious patterns unsafe', () => {
      expect(isUrlSafe('https://example.com/redirect=')).toBe(false);
      expect(isUrlSafe('https://example.com/php?url=')).toBe(false);
      expect(isUrlSafe('https://gamepathai.com/api')).toBe(false);
    });

    test('should handle null or empty URLs', () => {
      expect(isUrlSafe('')).toBe(false);
      expect(isUrlSafe(null as unknown as string)).toBe(false);
    });
  });

  describe('isCorsOrRedirectError', () => {
    test('should detect CORS errors', () => {
      expect(isCorsOrRedirectError(new Error('CORS error'))).toBe(true);
      expect(isCorsOrRedirectError('Cross-origin request blocked')).toBe(true);
    });

    test('should detect redirect errors', () => {
      expect(isCorsOrRedirectError(new Error('Redirect failed'))).toBe(true);
    });

    test('should detect opaque response errors', () => {
      expect(isCorsOrRedirectError('Opaque response received')).toBe(true);
    });

    test('should return false for unrelated errors', () => {
      expect(isCorsOrRedirectError(new Error('Network offline'))).toBe(false);
      expect(isCorsOrRedirectError('404 Not Found')).toBe(false);
    });

    test('should handle null or undefined values', () => {
      expect(isCorsOrRedirectError(null)).toBe(false);
      expect(isCorsOrRedirectError(undefined)).toBe(false);
    });
  });
});
