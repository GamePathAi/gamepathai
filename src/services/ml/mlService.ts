
/**
 * ML service handlers for specific machine learning models
 */
import { mlApiClient } from './mlApiClient';
import { toast } from "sonner";
import { 
  MLRouteOptimizerResponse, 
  MLPerformancePredictorResponse, 
  MLDetectedGamesResponse, 
  MLOptimizeGameResponse,
  MLOptimizationOptions,
  MLConnectivityTestResult
} from './types';
import { mlDiagnostics } from './mlDiagnostics';
import { CACHE_TTL } from './mlCacheManager';

/**
 * ML service handlers for specific machine learning models
 */
export const mlService = {
  /**
   * Route optimizer model: Analyzes and optimizes network routes for games
   */
  optimizeRoutes: async (gameId: string, params: {
    region?: string,
    aggressiveness?: 'low' | 'medium' | 'high'
  } = {}): Promise<MLRouteOptimizerResponse> => {
    try {
      return await mlApiClient.withRetry<MLRouteOptimizerResponse>(
        `/ml/route-optimizer/${gameId}`,
        {
          method: 'POST',
          body: JSON.stringify(params),
          cacheTTL: CACHE_TTL.ROUTES
        }
      );
    } catch (error) {
      console.error('Route optimization failed:', error);
      toast.error("Falha na otimização de rotas", {
        description: "Não foi possível otimizar as rotas de rede"
      });
      throw error;
    }
  },
  
  /**
   * Performance predictor model: Predicts optimal settings for games
   */
  predictPerformance: async (gameId: string, systemSpecs: any): Promise<MLPerformancePredictorResponse> => {
    try {
      return await mlApiClient.withRetry<MLPerformancePredictorResponse>(
        `/ml/performance-predictor/${gameId}`,
        {
          method: 'POST',
          body: JSON.stringify({ systemSpecs }),
          cacheTTL: CACHE_TTL.PERFORMANCE
        }
      );
    } catch (error) {
      console.error('Performance prediction failed:', error);
      toast.error("Falha na previsão de performance", {
        description: "Não foi possível prever as configurações ideais"
      });
      throw error;
    }
  },
  
  /**
   * Game detection model: Detects installed games and their state
   */
  detectGames: async (): Promise<MLDetectedGamesResponse> => {
    try {
      return await mlApiClient.withRetry<MLDetectedGamesResponse>(
        '/ml/game-detection',
        { 
          method: 'GET',
          cacheTTL: CACHE_TTL.GAMES
        }
      );
    } catch (error) {
      console.error('Game detection failed:', error);
      toast.error("Falha na detecção de jogos", {
        description: "Não foi possível detectar os jogos instalados"
      });
      throw error;
    }
  },
  
  /**
   * Optimize a specific game using ML recommendations
   */
  optimizeGame: async (gameId: string, options: MLOptimizationOptions = {}): Promise<MLOptimizeGameResponse> => {
    // Default all options to true if not specified
    const finalOptions = {
      optimizeRoutes: true,
      optimizeSettings: true,
      optimizeSystem: true,
      aggressiveness: 'medium',
      ...options
    };
    
    console.log(`🔧 Iniciando otimização para jogo ID: ${gameId}`, {
      options: finalOptions
    });
    
    try {
      toast.loading(`Otimizando ${gameId}...`);
      
      const result = await mlApiClient.withRetry<MLOptimizeGameResponse>(
        `/ml/optimize-game/${gameId}`,
        {
          method: 'POST',
          body: JSON.stringify(finalOptions),
          cacheTTL: CACHE_TTL.OPTIMIZE
        }
      );
      
      if (result.success) {
        toast.success("Otimização concluída", {
          description: `Jogo ${gameId} otimizado com sucesso`
        });
      }
      
      return result;
    } catch (error) {
      console.error('Game optimization failed:', error);
      toast.error("Falha na otimização do jogo", {
        description: `Não foi possível otimizar o jogo ${gameId}`
      });
      
      // FIX: Return properly typed error response instead of empty object
      throw error;
    }
  },
  
  /**
   * Clear all ML caches
   */
  clearCache: () => {
    mlApiClient.clearCache('ml');
    toast.success("Cache ML limpo", {
      description: "Os dados em cache do ML foram limpos"
    });
  },
  
  /**
   * Run diagnostics and return results
   */
  runDiagnostics: async () => {
    toast.loading("Executando diagnósticos ML...");
    try {
      const results = await mlDiagnostics.runDiagnostics();
      
      toast.success("Diagnósticos concluídos", {
        description: `Conectividade ML: ${results.success ? 'OK' : 'Falha'}`
      });
      
      return results;
    } catch (error) {
      toast.error("Falha nos diagnósticos", {
        description: "Não foi possível executar os diagnósticos ML"
      });
      throw error;
    }
  }
};

// Export diagnostics for convenience
export { mlDiagnostics };
