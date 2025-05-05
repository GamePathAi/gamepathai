
/**
 * Core ML API client implementation
 * Handles basic fetch operations with ML-specific configurations
 */
import { sanitizeApiUrl } from "../../utils/url";
import { reportMLIssue } from "../../utils/appInitializer";
import { MLApiError } from "./types";

// Constants
const ML_BASE_URL = ""; // Empty string means relative URLs
const isDev = process.env.NODE_ENV === 'development';
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

// ML-specific cache TTL values
const CACHE_TTL = {
  PREDICTIONS: 30 * 60 * 1000, // 30 minutes for predictions
  DETECTIONS: 10 * 60 * 1000,  // 10 minutes for detections
  OPTIMIZATIONS: 60 * 60 * 1000, // 1 hour for optimizations
  DEFAULT: 5 * 60 * 1000 // 5 minutes default
};

// Interface for cache options
interface CacheOptions {
  ttl: number;
}

// Interface for our cache manager
interface ApiCache {
  getOrFetch<T>(key: string, fetchFn: () => Promise<T>, options?: CacheOptions): Promise<T>;
  clearAll(): void;
}

// Define an empty apiCache object to use as fallback
const apiCache: ApiCache = {
  getOrFetch: async <T>(key: string, fetchFn: () => Promise<T>) => fetchFn(),
  clearAll: () => {}
};

/**
 * ML API client with specialized configuration for machine learning operations
 */
export const mlApiClient = {
  /**
   * Make a fetch request specifically configured for ML operations
   * Blocks redirects and handles ML-specific errors
   */
  async fetch<T>(endpoint: string, options: RequestInit = {}, cacheTTL?: number): Promise<T> {
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
    if (isReadOperation && cacheTTL !== 0) {
      const cacheKey = `ml:${url}:${JSON.stringify(options.body || {})}`;
      
      try {
        // Fixed: Don't use generics with untyped function call
        return await apiCache.getOrFetch(cacheKey, async () => {
          return await this.performFetch(url, headers, options);
        }, {
          ttl: cacheTTL || CACHE_TTL.DEFAULT
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
   */
  async withRetry<T>(
    endpoint: string, 
    options: RequestInit = {}, 
    retries: number = MAX_RETRIES, 
    cacheTTL?: number
  ): Promise<T> {
    try {
      // Fixed: Use type assertion instead of generic parameter
      return await this.fetch(endpoint, options, cacheTTL) as T;
    } catch (error: any) {
      // Check if we have retries left
      if (retries > 0) {
        // Log retry
        console.log(`🔄 Retrying ML operation after ${RETRY_DELAY}ms...`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        
        // Retry with one less retry count
        // Fixed: Don't use generic type parameter here as well
        return await this.withRetry(endpoint, options, retries - 1, cacheTTL) as T;
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
    // TODO: Implement more targeted cache clearing
    // For now, we clear all ML cache
    console.log(`Clearing ML API cache for pattern: ${endpointPattern}`);
    apiCache.clearAll();
  }
};

/**
 * ML API diagnostic tools
 */
export const mlDiagnostics = {
  /**
   * Test connectivity to ML endpoints
   */
  testConnectivity: async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/ml/health', {
        method: 'GET',
        headers: {
          'X-ML-Operation': '1',
          'X-No-Redirect': '1'
        },
        mode: 'cors',
        cache: 'no-store',
        redirect: isDev ? 'follow' : 'error'
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ML Diagnostics: Connectivity test failed:', error);
      return false;
    }
  },
  
  /**
   * Check for browser extensions that might interfere with ML operations
   */
  checkForInterfereingExtensions: (): {detected: boolean, extensions: string[]} => {
    console.log('🧠 ML Service: Checking for interfering extensions');
    
    const interfereingExtensions: string[] = [];
    
    // Check for known extension patterns in the DOM
    if (typeof document !== 'undefined') {
      // Check for Kaspersky
      if (document.querySelectorAll('[id*="kaspersky"], [class*="kaspersky"]').length > 0 || 
          document.querySelectorAll('script[src*="kaspersky"]').length > 0) {
        interfereingExtensions.push("Kaspersky Web Protection");
      }
      
      // Check for Avast
      if (document.querySelectorAll('[id*="avast"], [class*="avast"]').length > 0 ||
          document.querySelectorAll('script[src*="avast"]').length > 0) {
        interfereingExtensions.push("Avast Online Security");
      }
      
      // Check for AVG
      if (document.querySelectorAll('[id*="avg"], [class*="avg"]').length > 0 ||
          document.querySelectorAll('script[src*="avg"]').length > 0) {
        interfereingExtensions.push("AVG Online Security");
      }
      
      // Check for ad blockers
      if (document.querySelectorAll('[id*="adblock"], [class*="adblock"]').length > 0 ||
          document.querySelectorAll('script[src*="adblock"]').length > 0) {
        interfereingExtensions.push("Ad Blocker");
      }
    }
    
    return {
      detected: interfereingExtensions.length > 0,
      extensions: interfereingExtensions
    };
  },
  
  /**
   * Run a comprehensive ML connection test
   */
  runDiagnostics: async () => {
    const results = {
      health: false,
      connectivity: false,
      redirects: false,
      extensions: [] as string[],
      endpoints: {} as Record<string, boolean>
    };
    
    // Test basic health endpoint
    try {
      results.health = await mlDiagnostics.testConnectivity();
    } catch (e) {
      results.health = false;
    }
    
    // Check for extensions
    const extCheck = mlDiagnostics.checkForInterfereingExtensions();
    results.extensions = extCheck.extensions;
    
    // Test common ML endpoints
    const endpoints = [
      '/ml/health',
      '/api/ml/health',
      '/api/ml/game-detection',
      '/api/ml/route-optimizer'
    ];
    
    for (const endpoint of endpoints) {
      try {
        // Fixed: Remove generic type parameter
        const response = await fetch(endpoint, {
          method: 'HEAD',
          headers: { 'X-ML-Operation': '1', 'X-No-Redirect': '1' },
          redirect: 'manual'
        });
        results.endpoints[endpoint] = response.ok;
      } catch (e) {
        results.endpoints[endpoint] = false;
      }
    }
    
    return results;
  }
};
