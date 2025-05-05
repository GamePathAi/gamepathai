/**
 * Core ML API client implementation
 * Handles basic fetch operations with ML-specific configurations
 */
import { sanitizeApiUrl } from "../../../utils/url";
import { reportMLIssue } from "../../../utils/appInitializer";
import { MLApiRequestOptions, ML_API_CONFIG } from "../types/config";
import { mlCache } from "../mlCacheManager";  // Updated import to use the core implementation

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
export const apiClient = {
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
    const cacheTTL = options.cacheTTL ?? 0;
    
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
  }
};
