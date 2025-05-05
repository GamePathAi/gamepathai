
import { secureFetch } from "../../utils/url/ApiInterceptor";
import { UrlUtility } from "../../utils/url/UrlUtility";
import { apiCache } from "../../utils/api/cacheManager";

// Define a interface para a resposta de token
interface TokenResponse {
  access_token: string;
  refresh_token?: string;
}

// Remove noisy logging and only log in development
const isDev = process.env.NODE_ENV === 'development';
if (isDev) {
  console.log("API_BASE_URL being used:", UrlUtility.getApiBaseUrl());
}

export const baseApiClient = {
  /**
   * Enhanced fetch with caching, retries, and security
   */
  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      // Add default retry and caching options
      const enhancedOptions = {
        ...options,
        retry: {
          count: 2,
          delay: 1000,
          useExponentialBackoff: true
        },
        cache: {
          enabled: !endpoint.includes('auth') && !options.method || options.method === 'GET',
          ttl: 5 * 60 * 1000, // 5 minutes
          forceRefresh: false
        }
      };
      
      // Use the enhanced secureFetch utility
      return await secureFetch<T>(endpoint, enhancedOptions);
    } catch (error: any) {
      console.error(`❌ Request failed for ${endpoint}:`, error);
      
      // Re-throw with enhanced error information
      throw {
        status: error.status || 'error',
        message: error.message || 'Failed to fetch data from server',
        originalError: error
      };
    }
  },
  
  /**
   * Clear cache for specific endpoint
   */
  clearCache(endpoint: string): void {
    apiCache.invalidate(`fetch:${endpoint}:{}`);
  },
  
  /**
   * Clear all cached responses
   */
  clearAllCache(): void {
    apiCache.clearAll();
  }
};

// Function to attempt token renewal
async function tryRenewToken() {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;
    
    // Use a secure relative path
    const url = `/auth/refresh-token`;
    
    // Use secureFetch directly for auth operations
    const response = await secureFetch<TokenResponse>(url, {
      method: "POST",
      skipAuth: true, // Skip adding the expired auth token
      body: JSON.stringify({ refresh_token: refreshToken }),
      retry: {
        count: 1,
        delay: 500
      }
    });
    
    // Handle successful token refresh
    if (response && response.access_token) {
      localStorage.setItem("auth_token", response.access_token);
      if (response.refresh_token) {
        localStorage.setItem("refresh_token", response.refresh_token);
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}

// Export the token renewal function for use in other auth-related files
export { tryRenewToken };
