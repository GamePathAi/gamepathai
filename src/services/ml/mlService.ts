
/**
 * ML service main module
 * Re-exports functionality from specialized ML service modules
 */
import { routeOptimizerService } from './routeOptimizer';
import { performancePredictorService } from './performancePredictor';
import { gameDetectionService } from './gameDetection';
import { gameOptimizerService } from './gameOptimizer';
import { mlCacheService } from './cacheService';
import { diagnosticService } from './diagnosticService';
import { mlDiagnostics } from './mlDiagnostics';

/**
 * ML service handlers for specific machine learning models
 */
export const mlService = {
  /**
   * Route optimizer model: Analyzes and optimizes network routes for games
   */
  optimizeRoutes: routeOptimizerService.optimizeRoutes,
  
  /**
   * Performance predictor model: Predicts optimal settings for games
   */
  predictPerformance: performancePredictorService.predictPerformance,
  
  /**
   * Game detection model: Detects installed games and their state
   */
  detectGames: gameDetectionService.detectGames,
  
  /**
   * Optimize a specific game using ML recommendations
   */
  optimizeGame: gameOptimizerService.optimizeGame,
  
  /**
   * Clear all ML caches
   */
  clearCache: mlCacheService.clearCache,
  
  /**
   * Run diagnostics and return results
   */
  runDiagnostics: diagnosticService.runDiagnostics
};

// Export diagnostics for convenience
export { mlDiagnostics };
