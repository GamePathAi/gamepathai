
/**
 * Fetch interceptor for preventing unwanted redirects
 */

import { detectRedirectAttempt, sanitizeApiUrl } from '../url';

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
      
    // Sanitize URLs to ensure they're handled properly - use relative URLs whenever possible
    let url = originalUrl;
    
    // Always use relative URLs for health checks and API calls
    if (originalUrl.includes('gamepathai-dev-lb-1728469102.us-east-1.elb.amazonaws.com') || 
        originalUrl.includes('/health') ||
        originalUrl.includes('/api/')) {
        
      // Extract the path part from absolute URLs
      if (originalUrl.includes('http')) {
        try {
          const urlObj = new URL(originalUrl);
          url = urlObj.pathname + urlObj.search;
          console.log('✅ Converted absolute URL to relative:', originalUrl, '->', url);
        } catch (e) {
          url = originalUrl;
        }
      }
    } else {
      // For non-API URLs, just sanitize
      url = sanitizeApiUrl(originalUrl);
    }
    
    if (isMLOperation) {
      console.log('🧠 ML Fetch request to:', url);
    } else {
      console.log('🔍 Fetch request to:', url);
    }
    
    // Check for suspicious URLs that might be redirects
    if (detectRedirectAttempt(url)) {
      console.error('🚨 Blocked suspicious URL:', url);
      throw new Error('Blocked potential redirect URL: ' + url);
    }
    
    // Always add no-redirect headers to all requests
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
      cache: 'no-store',
      redirect: 'error'  // Error on redirects instead of following them
    };
    
    try {
      const response = await originalFetch(url, enhancedInit);
      
      // Check if a redirect happened despite our efforts
      if (response.url && response.url !== url && response.url.includes('gamepathai.com')) {
        console.error('⚠️ Response URL indicates redirect to gamepathai.com:', response.url);
        throw new Error('Detected redirect in response: ' + response.url);
      }
      
      return response;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('redirect')) {
        console.error('❌ Redirect blocked:', url);
        throw new Error(`Redirect blocked from ${url}`);
      }
      console.error('❌ Fetch error:', error);
      throw error;
    }
  };
};
