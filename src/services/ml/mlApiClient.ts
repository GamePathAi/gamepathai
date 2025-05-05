
/**
 * Core ML API client implementation
 * Handles basic fetch operations with ML-specific configurations
 */
import { sanitizeApiUrl } from "../../utils/url";
import { reportMLIssue } from "../../utils/appInitializer";
import { MLApiRequestOptions, ML_API_CONFIG } from "./mlApiTypes";
import { mlCache, CACHE_TTL, createFallbackCache } from "./mlCacheManager";

// Get environment-specific configuration
const isDev = process.env.NODE_ENV === 'development';
const env = process.env.NODE_ENV || 'development';
const config = ML_API_CONFIG[env] || ML_API_CONFIG.development;

// Constants
const ML_BASE_URL = config.baseUrl;
const MAX_RETRIES = config.maxRetries;
const RETRY_DELAY = config.retryDelay;

/**
 * ML API client with specialized configuration for machine learning operations
 */
export const mlApiClient = {
  /**
   * Make a fetch request specifically configured for ML operations
   * Blocks redirects and handles ML-specific errors
   */
  async fetch<T>(endpoint: string, options: MLApiRequestOptions = {}): Promise<T> {
    const isAbsoluteUrl = endpoint.startsWith('http://') || endpoint.startsWith('https://');
    let url = isAbsoluteUrl ? endpoint : `${ML_BASE_URL}${endpoint}`;
    
    // RELAXED: Don't aggressively sanitize if we're in development mode
    if (isDev) {
      // Keep the original URL in development to help diagnose issues
      console.log(`🧠 ML API Request: ${url}`);
    } else {
      // In production, sanitize to prevent redirects
      url = sanitizeApiUrl(url);
      console.log(`🧠 ML API Request: ${endpoint} -> ${url}`);
    }
    
    const headers = {
      "Content-Type": "application/json",
      "X-ML-Operation": "1",
      "X-No-Redirect": "1",
      "Cache-Control": "no-cache, no-store",
      "X-ML-Client": "react-web-client",
      ...(options.headers || {})
    };
    
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Check if we should use cache
    const isReadOperation = !options.method || options.method === 'GET';
    const cacheTTL = options.cacheTTL ?? CACHE_TTL.DEFAULT;
    
    if (isReadOperation && cacheTTL !== 0) {
      const cacheKey = `ml:${url}:${JSON.stringify(options.body || {})}`;
      
      try {
        return await mlCache.getOrFetch(cacheKey, async () => {
          return await this.performFetch(url, headers, options);
        }, {
          ttl: cacheTTL,
          forceRefresh: options.forceRefresh
        });
      } catch (error) {
        console.warn('Cache operation failed, fallback to regular fetch', error);
        // Continue with regular fetch
      }
    }
    
    // Regular fetch without caching
    return await this.performFetch(url, headers, options);
  },
  
  /**
   * Perform the actual fetch with ML-specific settings
   */
  async performFetch<T>(url: string, headers: Record<string, string>, options: RequestInit): Promise<T> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds timeout for ML
      
      const response = await fetch(url, {
        ...options,
        headers,
        mode: 'cors',
        credentials: 'include',
        cache: 'no-store',
        // MODIFIED: Allow redirects in development
        redirect: isDev ? 'follow' : 'error', 
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 204) {
        // No content response
        return {} as T;
      }
      
      // MODIFIED: Log but allow redirects in development
      if (response.redirected) {
        console.log(`⚠️ ML API redirect followed: ${url} -> ${response.url}`);
        
        // Only block in production
        if (!isDev && response.url.includes('gamepathai.com')) {
          console.error('🚨 ML API redirect to gamepathai.com blocked');
          throw new Error(`Blocked redirect to ${response.url}`);
        }
      }
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error(`ML API returned HTML instead of JSON (status ${response.status})`);
        }
        
        try {
          const errorData = await response.json();
          throw {...errorData, status: response.status};
        } catch (e) {
          throw new Error(`ML API error (status ${response.status})`);
        }
      }
      
      return await response.json() as T;
    } catch (error: any) {
      // Log ML API errors for debugging
      console.error('🚨 ML API error:', error);
      throw error;
    }
  },
  
  /**
   * Create a retry wrapper for ML operations that may sometimes fail
   * Fix: Removing the generic type parameter in the recursive call
   */
  async withRetry<T>(
    endpoint: string, 
    options: MLApiRequestOptions = {}, 
    retries: number = MAX_RETRIES
  ): Promise<T> {
    try {
      return await this.fetch<T>(endpoint, options);
    } catch (error: any) {
      // Check if we have retries left
      if (retries > 0) {
        // Log retry
        console.log(`🔄 Retrying ML operation after ${RETRY_DELAY}ms...`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        
        // Use type assertion instead of generic type parameter
        return await this.withRetry(endpoint, options, retries - 1) as T;
      }
      
      // If no retries left or it's a redirect issue, throw as ML error
      if (error.message && error.message.includes('redirect')) {
        // Enhanced logging for redirect-related errors
        console.info('Detalhes do erro de redirecionamento:', {
          url: endpoint,
          endpoint,
          message: error.message
        });
        
        throw {
          status: 'redirect_error',
          message: 'ML API redirect blocked - please use the diagnostic panel',
          originalError: error
        };
      }
      
      // Report ML issue for analytics
      reportMLIssue('API error', error);
      
      throw error;
    }
  },
  
  /**
   * Clear ML API cache by endpoint pattern
   */
  clearCache(endpointPattern: string): void {
    console.log(`Clearing ML API cache for pattern: ${endpointPattern}`);
    mlCache.clear(endpointPattern);
  }
};
