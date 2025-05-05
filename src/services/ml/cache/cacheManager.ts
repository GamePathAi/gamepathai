
/**
 * ML API cache manager
 * Handles caching of ML API responses
 */
import { apiCache } from "../../../services/utils/api/cacheManager";

/**
 * Cache TTL constants (in milliseconds)
 */
export const CACHE_TTL = {
  DEFAULT: 5 * 60 * 1000, // 5 minutes
  SHORT: 60 * 1000,       // 1 minute
  ROUTES: 10 * 60 * 1000, // 10 minutes
  PERFORMANCE: 15 * 60 * 1000, // 15 minutes
  GAMES: 30 * 60 * 1000,  // 30 minutes
  OPTIMIZE: 0            // No cache for optimization
};

/**
 * Interface for ML cache options
 */
export interface MLCacheOptions {
  ttl?: number;
  forceRefresh?: boolean;
}

/**
 * ML specific cache manager
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
    return apiCache.getOrFetch<T>(key, fetchFn, options);
  },

  /**
   * Clear cache entries by pattern
   */
  clear(pattern: string): void {
    // For now, delegate to apiCache
    // We can extend this with ML-specific logic if needed
    apiCache.clearAll();
  },

  /**
   * Create a fallback cache mechanism
   */
  createFallback<T>(key: string, fallbackData: T, ttl: number = CACHE_TTL.DEFAULT): void {
    apiCache.set(key, fallbackData, ttl);
  }
};

/**
 * Create a fallback cache for ML operations
 */
export const createFallbackCache = <T>(key: string, data: T): void => {
  mlCache.createFallback(key, data);
};
