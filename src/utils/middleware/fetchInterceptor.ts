
/**
 * Fetch interceptor for preventing unwanted redirects
 */

import { detectRedirectAttempt, sanitizeApiUrl } from '../url';
import { isTrustedDomain } from '../url/redirectDetection';

/**
 * Intercepts fetch to prevent unwanted redirects
 */
export const setupFetchInterceptor = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    try {
      // Convert input to string URL
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      // Check if the URL is trusted
      if (isTrustedDomain(url)) {
        // For trusted domains, proceed normally
        return originalFetch(input, init);
      }
      
      // Check if this URL should be blocked
      const shouldBlock = detectRedirectAttempt(url);
      
      if (shouldBlock) {
        console.error(`🚨 Blocked suspicious URL: ${url}`);
        return Promise.reject(new Error('Blocked potentially harmful URL'));
      }
      
      // Sanitize API URLs
      const sanitizedInput = typeof input === 'string' 
        ? sanitizeApiUrl(input)
        : input instanceof URL 
          ? new Request(sanitizeApiUrl(input.href), init) 
          : new Request(sanitizeApiUrl(input.url), {
              ...init,
              ...input
            });
      
      // Add protection headers to prevent redirects
      const safeInit = {
        ...init,
        headers: {
          ...(init?.headers || {}),
          'X-No-Redirect': '1'
        }
      };
      
      // Call the original fetch with sanitized parameters
      return originalFetch(sanitizedInput, safeInit);
    } catch (error) {
      console.error('Error in fetch interceptor:', error);
      return originalFetch(input, init);
    }
  };
};

/**
 * Reset the fetch interceptor to its original state
 */
export const resetFetchInterceptor = () => {
  // This is intentionally left simple as we don't store the original fetch
  // In a real implementation, you might want to store the original fetch and restore it
  console.log('Resetting fetch interceptor is not implemented');
};

/**
 * Creates a fetch function with additional security checks
 */
export const createSecureFetch = () => {
  return async function secureFetch(url: string, options?: RequestInit): Promise<Response> {
    // Check for suspicious URLs
    if (detectRedirectAttempt(url)) {
      console.error(`🚨 Blocked suspicious URL in secureFetch: ${url}`);
      throw new Error('Blocked potentially harmful URL');
    }
    
    // Add security headers
    const secureOptions = {
      ...options,
      headers: {
        ...(options?.headers || {}),
        'X-No-Redirect': '1',
        'Cache-Control': 'no-cache, no-store',
      }
    };
    
    try {
      const response = await fetch(url, secureOptions);
      
      // Check if the response URL is different from the requested URL (redirect happened)
      if (response.url && !url.endsWith(new URL(response.url).pathname)) {
        console.warn(`⚠️ Redirect detected: ${url} -> ${response.url}`);
        
        // If redirected to a non-trusted domain, throw an error
        if (!isTrustedDomain(response.url)) {
          throw new Error(`Redirect to untrusted domain: ${response.url}`);
        }
      }
      
      return response;
    } catch (error) {
      console.error(`Network error with ${url}:`, error);
      throw error;
    }
  };
};
