/**
 * Fetch interceptor for preventing unwanted redirects
 */

import { detectRedirectAttempt, sanitizeApiUrl } from '../url';
import { isTrustedDomain } from '../url/redirectDetection';
import { extractApiPath } from '../url/urlSanitization';

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
      
      // Extract just the path for API calls if it's an absolute URL
      let apiUrl = extractApiPath(originalUrl);
      
      console.log('✅ Local API call proceeding:', apiUrl);
      
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
      
      try {
        const response = await originalFetch(apiUrl, enhancedInit);
        
        // Even for API calls, check if a redirect happened
        if (response.url && apiUrl && !response.url.endsWith(apiUrl)) {
          console.warn(`⚠️ API redirect detected: ${apiUrl} -> ${response.url}`);
          
          if (response.url.includes('gamepathai.com') && !isDevelopment) {
            console.error('⚠️ Blocked redirect to gamepathai.com:', response.url);
            throw new Error('Blocked redirect to gamepathai.com');
          }
        }
        
        return response;
      } catch (error) {
        // Retry API calls once with different approach if they fail
        if (!originalUrl.includes('health')) {
          try {
            console.log(`⚠️ Retrying API call with different approach: ${apiUrl}`);
            
            // Try with a relative URL if the original was absolute
            if (originalUrl.startsWith('http') && apiUrl !== originalUrl) {
              console.log('↩️ Retrying with relative URL');
              return await originalFetch(apiUrl, enhancedInit);
            }
            
            // Otherwise, try with a different fetch mode
            enhancedInit.mode = 'no-cors';
            return await originalFetch(apiUrl, enhancedInit);
          } catch (retryError) {
            console.error('↩️ API retry also failed:', retryError);
          }
        }
        
        throw error;
      }
    }
    
    // For non-local URLs, apply sanitization
    let url = sanitizeApiUrl(originalUrl);
    
    if (isMLOperation) {
      console.log('🧠 ML Fetch request to:', url);
    } else {
      console.log('🔍 Fetch request to:', url);
    }
    
    // Check for suspicious URLs that might be redirects
    const isSuspicious = detectRedirectAttempt(url, isMLOperation);
    
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
      if (error.message && !error.message.includes('Failed to fetch')) {
        console.error('❌ Fetch error:', error.message);
      }
      throw error;
    }
  };
};
