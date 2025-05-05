
/**
 * Type definitions for the ML API client
 */

export interface MLApiError {
  status: string | number;
  message: string;
  originalError?: any;
}

/**
 * Options for ML API requests
 */
export interface MLApiRequestOptions extends RequestInit {
  // Number of retries for transient failures
  retries?: number;
  
  // Cache time to live in milliseconds
  cacheTTL?: number;
  
  // Whether to force a refresh from the network
  forceRefresh?: boolean;
}

/**
 * Configuration for ML API client
 */
export interface MLApiConfig {
  baseUrl: string;
  maxRetries: number;
  retryDelay: number;
  defaultCacheTTL: number;
}

/**
 * Configuration for different environments
 */
export const ML_API_CONFIG: Record<string, MLApiConfig> = {
  development: {
    baseUrl: "",  // Empty string means relative URLs
    maxRetries: 3,
    retryDelay: 2000,
    defaultCacheTTL: 5 * 60 * 1000 // 5 minutes
  },
  production: {
    baseUrl: "",  // Empty string means relative URLs
    maxRetries: 3,
    retryDelay: 2000,
    defaultCacheTTL: 5 * 60 * 1000 // 5 minutes
  },
  test: {
    baseUrl: "",  // Empty string for tests 
    maxRetries: 1,
    retryDelay: 500,
    defaultCacheTTL: 60 * 1000 // 1 minute
  }
};
