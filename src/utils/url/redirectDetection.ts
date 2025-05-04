
/**
 * Redirect detection utilities
 */

import { isProduction } from './environmentDetection';

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
      
      // List of trusted domains
      const trustedDomains = [
        'localhost',
        '127.0.0.1',
        'gamepathai-dev-lb-1728469102.us-east-1.elb.amazonaws.com',
        'gamepathai-dev-backup.us-east-1.elb.amazonaws.com',
        'js.stripe.com',
        'api.stripe.com',
        'fonts.googleapis.com',
        'fonts.gstatic.com'
      ];
      
      // Check if the hostname is in the trusted domains list
      return trustedDomains.some(domain => urlObj.hostname.includes(domain));
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
 * Detect potential redirect attempts in URLs
 * IMPROVED: Uses allow-list approach for trusted domains
 */
export const detectRedirectAttempt = (url: string, isMlOperation = false): boolean => {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // In development mode, be more permissive
  if (isDevelopment) {
    // Only block very obvious malicious URLs even in development
    const obviouslyMalicious = url.includes('gamepathai.com') && 
                              (url.includes('redirect=') || 
                               url.includes('php?url='));
                               
    if (obviouslyMalicious) {
      console.warn('🔍 Blocked suspicious URL even in development:', url);
      return true;
    }
    
    // In development mode, allow most URLs
    return false;
  }
  
  // Check if it's a local API call, which is always safe
  if ((url.startsWith('/api') || url.startsWith('/ml')) && 
      !url.includes('http:') && !url.includes('https:')) {
    return false; // Local API calls are safe
  }
  
  // Check for obviously malicious patterns
  const suspicious = url.includes('gamepathai.com') || 
                    url.includes('redirect=') ||
                    url.includes('php?url=') ||
                    url.includes('?url=') ||
                    url.includes('&url=');
  
  // Extra checks for ML operations which are more sensitive
  const mlSuspicious = isMlOperation && (
    (!url.includes('/api/ml/') && !url.includes('/ml/') && url.includes('/ml'))
  );
  
  // If it's suspicious, check if it's from a trusted domain before blocking
  if (suspicious || mlSuspicious) {
    // If it's a trusted domain, allow it despite suspicious patterns
    if (isTrustedDomain(url)) {
      console.log('✅ Allowing URL from trusted domain despite suspicious patterns:', url);
      return false;
    }
    
    // Log different messages based on context
    if (isMlOperation) {
      console.error('🚨 POTENTIAL ML REDIRECT DETECTED:', url);
    } else {
      console.error('🚨 POTENTIAL REDIRECT DETECTED:', url);
    }
    return true;
  }
  
  return false;
};
