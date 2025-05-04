
/**
 * ML service handlers for specific machine learning models
 */
import { mlApiClient } from './mlApiClient';
import { 
  MLRouteOptimizerResponse, 
  MLPerformancePredictorResponse, 
  MLDetectedGamesResponse, 
  MLOptimizeGameResponse 
} from './types';

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
    return mlApiClient.withRetry<MLRouteOptimizerResponse>(
      `/ml/route-optimizer/${gameId}`,
      {
        method: 'POST',
        body: JSON.stringify(params),
      }
    );
  },
  
  /**
   * Performance predictor model: Predicts optimal settings for games
   */
  predictPerformance: async (gameId: string, systemSpecs: any): Promise<MLPerformancePredictorResponse> => {
    return mlApiClient.withRetry<MLPerformancePredictorResponse>(
      `/ml/performance-predictor/${gameId}`,
      {
        method: 'POST',
        body: JSON.stringify({ systemSpecs }),
      }
    );
  },
  
  /**
   * Game detection model: Detects installed games and their state
   */
  detectGames: async (): Promise<MLDetectedGamesResponse> => {
    return mlApiClient.withRetry<MLDetectedGamesResponse>(
      '/ml/game-detection',
      { method: 'GET' }
    );
  },
  
  /**
   * Optimize a specific game using ML recommendations
   */
  optimizeGame: async (gameId: string, options: {
    optimizeRoutes?: boolean,
    optimizeSettings?: boolean,
    optimizeSystem?: boolean,
    aggressiveness?: 'low' | 'medium' | 'high',
    systemInfo?: any
  } = {}): Promise<MLOptimizeGameResponse> => {
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
    
    return mlApiClient.withRetry<MLOptimizeGameResponse>(
      `/ml/optimize-game/${gameId}`,
      {
        method: 'POST',
        body: JSON.stringify(finalOptions),
      }
    );
  }
};
