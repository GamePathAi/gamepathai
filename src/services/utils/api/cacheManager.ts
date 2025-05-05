
/**
 * API Response Cache Manager
 * Provides caching functionality for API responses
 */

interface CachedResponse<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  /** Time in milliseconds that the cache is valid */
  ttl?: number;
  /** Cache key, defaults to the URL */
  key?: string;
  /** Whether to force refetching data */
  forceRefresh?: boolean;
}

// Default cache time: 5 minutes
const DEFAULT_CACHE_TTL = 5 * 60 * 1000;

class ApiCacheManager {
  private cache: Map<string, CachedResponse<any>> = new Map();
  
  /**
   * Get cached response if valid, otherwise fetch and cache
   */
  async getOrFetch<T>(
    url: string, 
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const {
      ttl = DEFAULT_CACHE_TTL,
      key = url,
      forceRefresh = false
    } = options;
    
    // Check if we have a valid cached response
    const cachedResponse = this.cache.get(key);
    const now = Date.now();
    
    if (
      !forceRefresh && 
      cachedResponse && 
      cachedResponse.expiresAt > now
    ) {
      console.log(`🔄 Using cached response for: ${key}`);
      return cachedResponse.data;
    }
    
    // Fetch fresh data
    try {
      const data = await fetchFn();
      
      // Cache the response
      this.cache.set(key, {
        data,
        timestamp: now,
        expiresAt: now + ttl
      });
      
      return data;
    } catch (error) {
      // If fetch fails but we have cached data (even if expired), use it
      if (cachedResponse) {
        console.log(`⚠️ Fetch failed, using stale cache for: ${key}`);
        return cachedResponse.data;
      }
      throw error;
    }
  }
  
  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, ttl: number = DEFAULT_CACHE_TTL): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl
    });
  }
  
  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const cachedResponse = this.cache.get(key);
    const now = Date.now();
    
    if (cachedResponse && cachedResponse.expiresAt > now) {
      return cachedResponse.data;
    }
    
    return null;
  }
  
  /**
   * Clear cache for a specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all expired cache entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }
  
  /**
   * Clear entire cache
   */
  clearAll(): void {
    this.cache.clear();
  }
}

// Export a singleton instance
export const apiCache = new ApiCacheManager();
