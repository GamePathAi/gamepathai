
/**
 * ML API cache manager
 * Handles caching of ML API responses
 */
import { mlCache as coreCache, CACHE_TTL } from "../mlCacheManager";

/**
 * ML specific cache manager
 * This file now serves as a wrapper around the core implementation in mlCacheManager.ts
 * to maintain backward compatibility
 */
export { CACHE_TTL };

/**
 * Interface for ML cache options
 */
export interface MLCacheOptions {
  ttl?: number;
  forceRefresh?: boolean;
}

/**
 * ML specific cache manager wrapper
 */
export const mlCache = {
  /**
   * Get a value from cache or fetch it
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: MLCacheOptions = {}
  ): Promise<T> {
    return coreCache.getOrFetch<T>(key, fetchFn, options);
  },

  /**
   * Clear cache entries by pattern
   */
  clear(pattern: string): void {
    return coreCache.clear(pattern);
  },

  /**
   * Create a fallback cache mechanism
   */
  createFallback<T>(key: string, fallbackData: T, ttl: number = CACHE_TTL.DEFAULT): void {
    coreCache.set(key, fallbackData, ttl);
  }
};

/**
 * Create a fallback cache for ML operations
 */
export const createFallbackCache = <T>(key: string, data: T): void => {
  mlCache.createFallback(key, data);
};
