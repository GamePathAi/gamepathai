
/**
 * Fetch interceptor for preventing unwanted redirects
 */

import { detectRedirectAttempt, sanitizeApiUrl, isTrustedDomain } from '../url';

/**
 * Intercepts fetch to prevent unwanted redirects
 * Call this function at app initialization to patch global fetch
 */
export const setupFetchInterceptor = (): void => {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    // Get the URL as a string
    const originalUrl = typeof input === 'string' ? input : input.toString();
    const isMLOperation = init?.headers && 
      typeof init.headers === 'object' &&
      ('X-ML-Operation' in init.headers);
      
    // Allow local health checks and API calls to proceed without modification
    if (originalUrl === '/health' || 
        originalUrl.startsWith('/api/') || 
        originalUrl.startsWith('/ml/')) {
      console.log('✅ Local API call proceeding normally:', originalUrl);
      
      // Add safety headers but don't modify the URL
      const enhancedInit: RequestInit = {
        ...init || {},
        headers: {
          ...init?.headers || {},
          "X-No-Redirect": "1",
          "X-Requested-With": "XMLHttpRequest",
          "Cache-Control": "no-cache, no-store",
          "Pragma": "no-cache"
        },
        mode: 'cors',
        credentials: 'include',
        cache: 'no-store'
      };
      
      // In production use error for redirect, in development allow following
      if (!isDevelopment) {
        enhancedInit.redirect = 'error';
      }
      
      return originalFetch(originalUrl, enhancedInit);
    }
    
    // For non-local URLs, apply sanitization
    let url = sanitizeApiUrl(originalUrl);
    
    if (isMLOperation) {
      console.log('🧠 ML Fetch request to:', url);
    } else {
      console.log('🔍 Fetch request to:', url);
    }
    
    // Check for suspicious URLs that might be redirects
    const isSuspicious = detectRedirectAttempt(url);
    
    // If the URL is suspicious but from a trusted domain, allow it to proceed
    if (isSuspicious && isTrustedDomain(url)) {
      console.log('✅ Allowing trusted domain despite suspicious patterns:', url);
    } else if (isSuspicious) {
      console.error('🚨 Blocked suspicious URL:', url);
      throw new Error('Blocked potential redirect URL: ' + url);
    }
    
    // Always add safety headers to all requests
    const enhancedInit: RequestInit = {
      ...init || {},
      headers: {
        ...init?.headers || {},
        "X-No-Redirect": "1",
        "X-Requested-With": "XMLHttpRequest",
        "Cache-Control": "no-cache, no-store",
        "Pragma": "no-cache"
      },
      mode: 'cors',
      credentials: 'include',
      cache: 'no-store'
    };
    
    // In development, allow redirects to be followed
    // In production, error on redirects
    enhancedInit.redirect = isDevelopment ? 'follow' : 'error';
    
    try {
      const response = await originalFetch(url, enhancedInit);
      
      // Check if a redirect happened despite our efforts
      if (response.url && response.url !== url) {
        console.log('⚠️ Redirect occurred:', url, '->', response.url);
        
        // Only block gamepathai.com redirects
        if (response.url.includes('gamepathai.com') && !isDevelopment) {
          console.error('⚠️ Blocked redirect to gamepathai.com:', response.url);
          throw new Error('Blocked redirect to: ' + response.url);
        }
      }
      
      return response;
    } catch (error) {
      // Only log significant errors
      if (!error.message.includes('Failed to fetch')) {
        console.error('❌ Fetch error:', error);
      }
      throw error;
    }
  };
};
