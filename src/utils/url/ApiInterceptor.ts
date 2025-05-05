
/**
 * API Interceptor for fetch requests with built-in security and redirect prevention
 */

import { UrlUtility } from './UrlUtility';
import { isProduction, isDevelopment } from './environmentDetection';
import { apiCache } from '../api/cacheManager';
import { 
  detectRedirectAttempt, 
  isSuspiciousDomain, 
  isExpectedRedirect 
} from './redirectDetection';

// FIXED: Define a separate cache interface that doesn't conflict with RequestInit
interface ApiRequestCache {
  enabled: boolean;
  ttl?: number;
  forceRefresh?: boolean;
}

// FIXED: No longer extends RequestInit directly
export interface ApiRequestOptions extends Omit<RequestInit, 'cache'> {
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
  
  /**
   * Caching options
   */
  cache?: ApiRequestCache;
  
  /**
   * Retry options
   */
  retry?: {
    /** Number of retries */
    count: number;
    /** Delay between retries in milliseconds */
    delay?: number;
    /** Whether to use exponential backoff */
    useExponentialBackoff?: boolean;
  };
}

/**
 * Enhanced fetch with security protections against redirects
 */
export const secureFetch = async <T>(url: string, options: ApiRequestOptions = {}): Promise<T> => {
  // Apply security measures
  const secureUrl = UrlUtility.sanitizeApiUrl(url);
  
  // Check for redirect attempts - be more permissive in development
  if (detectRedirectAttempt(secureUrl, options.isMlOperation)) {
    if (isDevelopment()) {
      console.warn(`⚠️ Potential redirect detected but allowing in development mode: ${secureUrl}`);
    } else {
      throw new Error(`Blocked potential redirect attempt to: ${secureUrl}`);
    }
  }
  
  // Check if we should use cache
  if (options.cache?.enabled) {
    const cacheKey = `fetch:${secureUrl}:${JSON.stringify(options.body || {})}`;
    
    try {
      return await apiCache.getOrFetch<T>(cacheKey, async () => {
        return await performFetch<T>(secureUrl, options);
      }, {
        ttl: options.cache.ttl,
        forceRefresh: options.cache.forceRefresh
      });
    } catch (error) {
      // Fall through to regular fetch if cache operations fail
      console.warn('Cache operation failed, fallback to regular fetch', error);
    }
  }
  
  // Regular fetch without caching
  return await performFetch<T>(secureUrl, options);
};

/**
 * Perform the actual fetch with all security measures
 */
const performFetch = async <T>(secureUrl: string, options: ApiRequestOptions = {}): Promise<T> => {
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
  if (isDevelopment()) {
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
      // CHANGE: Allow redirects in development mode for easier debugging
      redirect: isDevelopment() ? 'follow' : 'error',
      signal: controller.signal
    });
    
    // Clean up timeout
    if (timeoutId) clearTimeout(timeoutId);
    
    // In development, log redirects but don't block them
    if (isDevelopment() && response.redirected) {
      console.warn('⚠️ Redirect detected:', {
        from: secureUrl,
        to: response.url
      });
    }
    // In production, verify response is not a redirect (unless expected)
    else if (!isDevelopment() && response.redirected) {
      const isAllowed = isExpectedRedirect(secureUrl, response.url);
      
      if (!isAllowed) {
        console.error('⚠️ Detected redirect in response:', {
          original: secureUrl,
          redirected: response.url
        });
        
        // Only throw if redirecting to suspicious domain
        if (isSuspiciousDomain(response.url)) {
          throw new Error(`Detected redirect to ${response.url}`);
        }
      }
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
    
    // Handle retries if configured
    if (options.retry && options.retry.count > 0) {
      const delay = options.retry.useExponentialBackoff 
        ? (options.retry.delay || 1000) * (2 ** (options.retry.count - 1))
        : (options.retry.delay || 1000);
      
      console.log(`🔄 Retrying request to ${secureUrl} in ${delay}ms. Attempts left: ${options.retry.count - 1}`);
      
      // Wait for delay
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // FIXED: Use correct variable name
      return secureFetch<T>(secureUrl, {
        ...options,
        retry: {
          ...options.retry,
          count: options.retry.count - 1
        }
      });
    }
    
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
