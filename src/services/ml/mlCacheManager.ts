
/**
 * ML-specific cache manager for API responses
 */

// ML-specific cache TTL values
export const CACHE_TTL = {
  PREDICTIONS: 30 * 60 * 1000, // 30 minutes for predictions
  DETECTIONS: 10 * 60 * 1000,  // 10 minutes for detections
  OPTIMIZATIONS: 60 * 60 * 1000, // 1 hour for optimizations
  DEFAULT: 5 * 60 * 1000, // 5 minutes default
  ROUTES: 30 * 60 * 1000,      // 30 min for route optimization
  PERFORMANCE: 60 * 60 * 1000, // 1 hour for performance predictions
  GAMES: 15 * 60 * 1000,       // 15 min for game detection
  OPTIMIZE: 60 * 60 * 1000     // 1 hour for game optimization
};

// Interface for cache options
export interface CacheOptions {
  ttl: number;
  forceRefresh?: boolean;
}

// Interface for our cache manager
export interface ApiCache {
  getOrFetch<T>(key: string, fetchFn: () => Promise<T>, options?: CacheOptions): Promise<T>;
  clearAll(): void;
  clear(pattern: string): void;
  set<T>(key: string, data: T, ttl: number): void;
  get<T>(key: string): T | null;
}

/**
 * In-memory cache implementation for ML API responses
 */
class MLCacheManager implements ApiCache {
  private cache: Map<string, { data: any, expiresAt: number }> = new Map();
  
  /**
   * Get data from cache or fetch it if not available
   */
  async getOrFetch<T>(
    key: string, 
    fetchFn: () => Promise<T>,
    options: CacheOptions = { ttl: CACHE_TTL.DEFAULT }
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);
    
    // Return cached data if it exists and hasn't expired
    if (cached && cached.expiresAt > now && !options.forceRefresh) {
      console.log(`🧠 ML Cache: Using cached data for ${key}`);
      return cached.data as T;
    }
    
    // Fetch new data
    try {
      const data = await fetchFn();
      
      // Cache the result
      this.set(key, data, options.ttl);
      
      return data;
    } catch (error) {
      // If there's an error but we have stale data, return that
      if (cached) {
        console.warn(`🧠 ML Cache: Error fetching fresh data, using stale cache for ${key}`);
        return cached.data as T;
      }
      
      // Otherwise propagate the error
      throw error;
    }
  }
  
  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl: number = CACHE_TTL.DEFAULT): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl
    });
  }
  
  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }
    
    return null;
  }
  
  /**
   * Clear cache for keys matching a pattern
   */
  clear(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }
}

// Export a singleton instance
export const mlCache: ApiCache = new MLCacheManager();

// Also export a simple fallback cache for environments without proper caching
export const createFallbackCache = (): ApiCache => ({
  getOrFetch: async <T>(key: string, fetchFn: () => Promise<T>) => fetchFn(),
  clearAll: () => {},
  clear: () => {},
  set: () => {},
  get: () => null
});
