
/**
 * ML Performance Predictor Service
 * Predicts optimal settings for games
 */
import { mlApiClient } from './mlApiClient';
import { toast } from "sonner";
import { MLPerformancePredictorResponse } from './types';
import { CACHE_TTL } from './mlCacheManager'; // Updated import path

export const performancePredictorService = {
  /**
   * Predict performance for a specific game based on system specs
   */
  predictPerformance: async (gameId: string, systemSpecs: any): Promise<MLPerformancePredictorResponse> => {
    try {
      const result = await mlApiClient.withRetry(
        `/ml/performance-predictor/${gameId}`,
        {
          method: 'POST',
          body: JSON.stringify({ systemSpecs }),
          cacheTTL: CACHE_TTL.PERFORMANCE
        }
      );
      return result as MLPerformancePredictorResponse;
    } catch (error) {
      console.error('Performance prediction failed:', error);
      toast.error("Falha na previsão de performance", {
        description: "Não foi possível prever as configurações ideais"
      });
      throw error;
    }
  }
};
