
/**
 * ML Route Optimizer Service
 * Handles network route optimization for games
 */
import { mlApiClient } from './mlApiClient';
import { toast } from "sonner";
import { MLRouteOptimizerResponse } from './types';
import { CACHE_TTL } from './mlCacheManager'; // Updated import path

export const routeOptimizerService = {
  /**
   * Optimize network routes for a specific game
   */
  optimizeRoutes: async (gameId: string, params: {
    region?: string,
    aggressiveness?: 'low' | 'medium' | 'high'
  } = {}): Promise<MLRouteOptimizerResponse> => {
    try {
      const result = await mlApiClient.withRetry(
        `/ml/route-optimizer/${gameId}`,
        {
          method: 'POST',
          body: JSON.stringify(params),
          cacheTTL: CACHE_TTL.ROUTES
        }
      );
      return result as MLRouteOptimizerResponse;
    } catch (error) {
      console.error('Route optimization failed:', error);
      toast.error("Falha na otimização de rotas", {
        description: "Não foi possível otimizar as rotas de rede"
      });
      throw error;
    }
  }
};
