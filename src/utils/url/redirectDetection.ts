
/**
 * Redirect detection utilities
 */

import { isProduction } from './environmentDetection';

// Lista de domínios confiáveis que são sempre permitidos
const TRUSTED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'gamepathai-dev-lb-1728469102.us-east-1.elb.amazonaws.com',
  'gamepathai-dev-backup.us-east-1.elb.amazonaws.com',
  'js.stripe.com',
  'api.stripe.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

// Lista de domínios suspeitos que sempre são bloqueados
const SUSPICIOUS_DOMAINS = [
  'gamepathai.com'
];

// Padrões de URL que frequentemente indicam redirecionamentos
const REDIRECT_PATTERNS = [
  'redirect=',
  'redirect.php',
  '/redirect/',
  'go.php?',
  'php?url=',
  '?url=',
  '&url='
];

/**
 * Special function to validate ML endpoint URLs
 * Ensures they follow the expected pattern
 */
export const validateMlEndpoint = (endpoint: string): boolean => {
  // ML endpoints should always follow these patterns
  const validPatterns = [
    /^\/api\/ml\//,
    /^\/ml\//
  ];
  
  // If it matches any valid pattern, it's valid
  if (validPatterns.some(pattern => pattern.test(endpoint))) {
    return true;
  }
  
  console.error('🚨 Invalid ML endpoint format:', endpoint);
  return false;
};

/**
 * Check if a URL is from a trusted domain
 * This function helps distinguish between legitimate and suspicious domains
 */
export const isTrustedDomain = (url: string): boolean => {
  // Always trust relative URLs
  if (url.startsWith('/') || url.startsWith('#')) {
    return true;
  }
  
  try {
    // For absolute URLs, check if it's a trusted domain
    if (url.includes('http')) {
      const urlObj = new URL(url);
      
      // Check if the hostname is in the trusted domains list
      return TRUSTED_DOMAINS.some(domain => urlObj.hostname.includes(domain));
    }
  } catch (e) {
    // If we can't parse the URL, assume it's not trusted
    console.warn('Could not parse URL for trust check:', url);
    return false;
  }
  
  // Default to trusting relative URLs and URLs without protocol
  return !url.includes('http');
};

/**
 * Check if a URL is from a known suspicious domain
 */
export const isSuspiciousDomain = (url: string): boolean => {
  try {
    if (url.includes('http')) {
      const urlObj = new URL(url);
      return SUSPICIOUS_DOMAINS.some(domain => urlObj.hostname.includes(domain));
    }
  } catch (e) {
    // If we can't parse the URL, be cautious
    return false;
  }
  
  return false;
};

/**
 * Check if URL contains redirect patterns
 */
export const containsRedirectPattern = (url: string): boolean => {
  return REDIRECT_PATTERNS.some(pattern => url.includes(pattern));
};

/**
 * Detect potential redirect attempts in URLs
 * IMPROVED: Uses allow-list approach for trusted domains
 */
export const detectRedirectAttempt = (url: string, isMlOperation = false): boolean => {
  // Check if we're in development mode - more permissive
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // In development mode, be more permissive
  if (isDevelopment) {
    // Only block very obvious malicious URLs even in development
    return isSuspiciousDomain(url) && containsRedirectPattern(url);
  }
  
  // Check if it's a local API call, which is always safe
  if ((url.startsWith('/api') || url.startsWith('/ml')) && 
      !url.includes('http:') && !url.includes('https:')) {
    return false; // Local API calls are safe
  }
  
  // For ML operations, be extra cautious
  if (isMlOperation) {
    // For ML operations, only allow trusted domains
    if (!isTrustedDomain(url)) {
      console.log('🔒 Blocking non-trusted domain for ML operation:', url);
      return true;
    }
    
    // Extra validation for ML endpoints
    if (url.includes('/ml/') && !validateMlEndpoint(url)) {
      console.error('🚨 Invalid ML endpoint format:', url);
      return true;
    }
  }
  
  // If it's a suspicious domain, block it
  if (isSuspiciousDomain(url)) {
    console.error('🚨 Detected suspicious domain:', url);
    return true;
  }
  
  // If it contains redirect patterns and is not from a trusted domain, block it
  if (containsRedirectPattern(url) && !isTrustedDomain(url)) {
    console.error('🚨 Detected redirect pattern in non-trusted domain:', url);
    return true;
  }
  
  return false;
};

/**
 * Check if a URL is an expected redirect
 * Some redirects are legitimate (e.g. auth flows)
 */
export const isExpectedRedirect = (fromUrl: string, toUrl: string): boolean => {
  // Auth redirects are expected
  if (fromUrl.includes('/auth/') || fromUrl.includes('/login')) {
    return true;
  }
  
  // Redirects to trusted domains are expected
  if (isTrustedDomain(toUrl)) {
    return true;
  }
  
  return false;
};
