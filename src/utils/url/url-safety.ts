/**
 * URL safety and validation utilities
 */

import { isTrustedDomain } from './redirectDetection';

/**
 * Check if a URL is safe according to our security rules
 */
export const isUrlSafe = (url: string): boolean => {
  // Checks if a URL is safe according to our security rules
  if (!url) return false;
  
  // Relative URLs are always safe
  if (url.startsWith('/') || url.startsWith('#')) return true;
  
  // Trusted domains are safe
  if (isTrustedDomain(url)) return true;
  
  // Check for suspicious patterns
  const hasSuspiciousPattern = [
    'php?url=', '?url=', '&url=',
    'redirect=', 'redirect.php', '/redirect/', 
    'go.php?', 'gamepathai.com'
  ].some(pattern => url.includes(pattern));
  
  // If it has suspicious patterns, it's not safe
  if (hasSuspiciousPattern) return false;
  
  // Otherwise consider it safe
  return true;
};

/**
 * Check if a network error might be due to CORS or redirect issues
 */
export const isCorsOrRedirectError = (error: any): boolean => {
  if (!error) return false;
  
  const errorString = String(error).toLowerCase();
  return (
    errorString.includes('cors') || 
    errorString.includes('cross-origin') ||
    errorString.includes('redirect') ||
    errorString.includes('opaque')
  );
};
