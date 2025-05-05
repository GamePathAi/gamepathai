
import { isTrustedDomain, validateMlEndpoint, detectRedirectAttempt } from '../redirectDetection';

describe('redirectDetection utilities', () => {
  describe('isTrustedDomain', () => {
    test('should trust relative URLs', () => {
      expect(isTrustedDomain('/api/health')).toBe(true);
      expect(isTrustedDomain('#section')).toBe(true);
    });

    test('should trust localhost domains', () => {
      expect(isTrustedDomain('http://localhost:3000/api')).toBe(true);
      expect(isTrustedDomain('http://127.0.0.1:8080/health')).toBe(true);
    });

    test('should trust known trusted domains', () => {
      expect(isTrustedDomain('https://gamepathai-dev-lb-1728469102.us-east-1.elb.amazonaws.com/api')).toBe(true);
      expect(isTrustedDomain('https://js.stripe.com/v3/')).toBe(true);
    });

    test('should not trust unknown domains', () => {
      expect(isTrustedDomain('https://malicious-site.com')).toBe(false);
      expect(isTrustedDomain('https://gamepathai.com/redirect')).toBe(false);
    });
  });

  describe('validateMlEndpoint', () => {
    test('should validate correct ML endpoint formats', () => {
      expect(validateMlEndpoint('/api/ml/analyze')).toBe(true);
      expect(validateMlEndpoint('/ml/optimize')).toBe(true);
    });

    test('should reject incorrect ML endpoint formats', () => {
      expect(validateMlEndpoint('/api/unauthorized')).toBe(false);
      expect(validateMlEndpoint('/malicious/ml/endpoint')).toBe(false);
    });
  });

  describe('detectRedirectAttempt', () => {
    const originalEnv = process.env.NODE_ENV;
    
    beforeEach(() => {
      // Mock process.env.NODE_ENV
      jest.resetModules();
    });
    
    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    test('should allow safe URLs in development', () => {
      process.env.NODE_ENV = 'development';
      expect(detectRedirectAttempt('/api/health')).toBe(false);
      expect(detectRedirectAttempt('https://localhost:3000/api')).toBe(false);
    });

    test('should block suspicious URLs even in development', () => {
      process.env.NODE_ENV = 'development';
      expect(detectRedirectAttempt('https://gamepathai.com/redirect=')).toBe(true);
    });

    test('should be more strict in production', () => {
      process.env.NODE_ENV = 'production';
      expect(detectRedirectAttempt('/api/health')).toBe(false);
      expect(detectRedirectAttempt('https://untrusted-domain.com')).toBe(true);
    });

    test('should be extra cautious with ML operations', () => {
      process.env.NODE_ENV = 'production';
      expect(detectRedirectAttempt('/api/ml/analyze', true)).toBe(false);
      expect(detectRedirectAttempt('/suspicious/ml', true)).toBe(true);
    });
  });
});
