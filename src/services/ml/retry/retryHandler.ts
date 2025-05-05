
/**
 * ML API retry handler
 * Provides retry functionality for failed API requests
 */
import { reportMLIssue } from "../../../utils/appInitializer";
import { MLApiRequestOptions } from "../types/config";
import { apiClient } from "../core/apiClient";

// Get environment-specific configuration from env
const env = process.env.NODE_ENV || 'development';
import { ML_API_CONFIG } from "../types/config";
const config = ML_API_CONFIG[env] || ML_API_CONFIG.development;

// Constants
const MAX_RETRIES = config.maxRetries;
const RETRY_DELAY = config.retryDelay;

/**
 * Retry handler for ML API requests
 */
export const retryHandler = {
  /**
   * Execute a request with automatic retries
   */
  async withRetry<T>(
    endpoint: string,
    options: MLApiRequestOptions = {},
    retries: number = MAX_RETRIES
  ): Promise<T> {
    try {
      return await apiClient.fetch<T>(endpoint, options);
    } catch (error: any) {
      // Check if we have retries left
      if (retries > 0) {
        // Log retry
        console.log(`🔄 Retrying ML operation after ${RETRY_DELAY}ms...`);
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        
        // Create a non-generic function to fix the TypeScript error with type parameters
        const retryFn = (): Promise<T> => {
          return this.withRetry<T>(endpoint, options, retries - 1);
        };
        
        // Call the non-generic function
        return retryFn();
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
   * Helper method to avoid TypeScript error with generic type parameters in recursive calls
   * (This is no longer used since we've implemented the retryFn approach above)
   */
  executeRetry<T>(endpoint: string, options: MLApiRequestOptions, retries: number): Promise<T> {
    return this.withRetry(endpoint, options, retries);
  }
};
