
/**
 * Content Security Policy configuration
 */

// Generate CSP Header for Vite server
export const generateCSP = (): string => {
  return [
    `default-src 'self';`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;`,
    `font-src 'self' https://fonts.gstatic.com;`,
    `img-src 'self' data: https://*.stripe.com https://images.unsplash.com blob:;`,
    `connect-src 'self' https://*.stripe.com http://localhost:* https://localhost:* https://gamepathai-dev-lb-1728469102.us-east-1.elb.amazonaws.com wss://*.stripe.com;`,
    `frame-src 'self' https://*.stripe.com;`,
    `form-action 'self';`,
    `base-uri 'self';`,
    `frame-ancestors 'self';`,
  ].join(' ');
};

// Configure security headers
export const securityHeaders = {
  'Content-Security-Policy': generateCSP(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY', // Additional protection against framing
  'X-XSS-Protection': '1; mode=block'
};
