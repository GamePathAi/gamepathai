
/**
 * API Interceptor for fetch requests with built-in security and redirect prevention
 */

import { UrlUtility } from './UrlUtility';
import { isProduction } from './environmentDetection';

interface ApiRequestOptions extends RequestInit {
  /**
   * Whether this request is for an ML operation (higher security)
   */
  isMlOperation?: boolean;
  
  /**
   * Timeout in milliseconds for the request
   */
  timeoutMs?: number;
  
  /**
   * Whether to skip auth token
   */
  skipAuth?: boolean;
}

/**
 * Enhanced fetch with security protections against redirects
 */
export const secureFetch = async <T>(url: string, options: ApiRequestOptions = {}): Promise<T> => {
  // Apply security measures
  const secureUrl = UrlUtility.sanitizeApiUrl(url);
  
  // Check for redirect attempts
  if (UrlUtility.isRedirectAttempt(secureUrl, options.isMlOperation)) {
    throw new Error(`Blocked potential redirect attempt to: ${secureUrl}`);
  }
  
  // Default headers with security measures
  const headers = {
    "Content-Type": "application/json",
    "X-No-Redirect": "1", // Prevent redirects
    "X-Client-Source": "react-frontend",
    "Cache-Control": "no-cache, no-store",
    "Pragma": "no-cache",
    "X-Max-Redirects": "0",
    "X-Requested-With": "XMLHttpRequest",
    ...(options.headers || {})
  };
  
  // Add authentication if available and not skipped
  if (!options.skipAuth) {
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  
  // Add ML operation header if needed
  if (options.isMlOperation) {
    headers["X-ML-Operation"] = "1";
  }
  
  // Add development header if in dev mode
  if (!isProduction()) {
    headers["X-Development-Mode"] = "1";
  }
  
  // Set up timeout if specified
  const controller = new AbortController();
  const timeoutId = options.timeoutMs 
    ? setTimeout(() => controller.abort(), options.timeoutMs) 
    : undefined;
  
  try {
    const response = await fetch(secureUrl, {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include',
      cache: 'no-store',
      // Error on redirect, don't follow
      redirect: 'error',
      signal: controller.signal
    });
    
    // Clean up timeout
    if (timeoutId) clearTimeout(timeoutId);
    
    // Verify response is not a redirect
    if (response.url && response.url !== secureUrl) {
      console.error('⚠️ Detected redirect in response:', {
        original: secureUrl,
        redirected: response.url
      });
      throw new Error(`Detected redirect to ${response.url}`);
    }
    
    // Handle error responses
    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      
      // Handle HTML responses (likely redirects)
      if (contentType && contentType.includes('text/html')) {
        throw {
          status: response.status,
          message: 'Received HTML response when expecting JSON. Possible redirect or error page.',
          isHtmlResponse: true
        };
      }
      
      // Handle auth errors
      if (response.status === 401) {
        // Could implement token refresh here
        throw {
          status: 401,
          message: 'Authentication required'
        };
      }
      
      // Handle other errors
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        ...errorData
      };
    }
    
    // Check for HTML response when JSON expected
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json') && contentType.includes('text/html')) {
      throw {
        status: 'error',
        message: 'Received HTML response when expecting JSON. Possible redirect or server error.',
        isHtmlResponse: true
      };
    }
    
    // Parse JSON response
    return await response.json() as T;
  } catch (error: any) {
    // Clean up timeout
    if (timeoutId) clearTimeout(timeoutId);
    
    // Enhance error information
    if (error.name === 'AbortError') {
      throw {
        status: 'timeout',
        message: `Request to ${secureUrl} timed out after ${options.timeoutMs}ms`,
        originalError: error
      };
    }
    
    // Check if the error is redirect-related
    if (error.message && 
       (error.message.includes('redirect') || error.message.includes('gamepathai.com'))) {
      console.error('🚨 REDIRECT ATTEMPT DETECTED AND BLOCKED');
    }
    
    throw {
      status: 'error',
      message: 'Request failed',
      originalError: error
    };
  }
};
