
/**
 * ML Cache Service
 * Handles ML-specific cache operations
 */
import { mlApiClient } from './mlApiClient';
import { toast } from "sonner";

export const mlCacheService = {
  /**
   * Clear all ML caches
   */
  clearCache: () => {
    mlApiClient.clearCache('ml');
    toast.success("Cache ML limpo", {
      description: "Os dados em cache do ML foram limpos"
    });
  }
};
