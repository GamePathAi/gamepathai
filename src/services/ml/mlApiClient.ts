
/**
 * ML API Client
 * Main entry point for ML API operations
 */
import { apiClient } from "./core/apiClient";
import { retryHandler } from "./retry/retryHandler";
import { mlCache } from "./cache/cacheManager";
import { MLApiRequestOptions } from "./types/config";

/**
 * ML API client with specialized configuration for machine learning operations
 */
export const mlApiClient = {
  /**
   * Make a fetch request specifically configured for ML operations
   */
  async fetch<T>(endpoint: string, options: MLApiRequestOptions = {}): Promise<T> {
    return apiClient.fetch<T>(endpoint, options);
  },
  
  /**
   * Create a retry wrapper for ML operations that may sometimes fail
   */
  async withRetry<T>(
    endpoint: string, 
    options: MLApiRequestOptions = {}, 
    retries?: number
  ): Promise<T> {
    return retryHandler.withRetry<T>(endpoint, options, retries);
  },
  
  /**
   * Clear ML API cache by endpoint pattern
   */
  clearCache(endpointPattern: string): void {
    console.log(`Clearing ML API cache for pattern: ${endpointPattern}`);
    mlCache.clear(endpointPattern);
  }
};
