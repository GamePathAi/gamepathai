
/**
 * Type definitions for ML API responses and options
 */

export interface MLApiError {
  status: string | number;
  message: string;
  code?: string;
  details?: any;
}

/**
 * ML Route Optimizer Response
 */
export interface MLRouteOptimizerResponse {
  success: boolean;
  routes: {
    optimized: boolean;
    latencyReduction: number;
    stabilityImprovement: number;
    recommendations: string[];
  };
}

/**
 * ML Performance Predictor Response
 */
export interface MLPerformancePredictorResponse {
  success: boolean;
  predictions: {
    fps: number;
    stability: number;
    recommendations: {
      settings: Record<string, any>;
      priority: 'high' | 'medium' | 'low';
    }[];
  };
}

/**
 * ML Detected Games Response
 */
export interface MLDetectedGamesResponse {
  success: boolean;
  detectedGames: Array<{
    id: string;
    name: string;
    executable: string;
    installPath?: string;
  }>;
}

/**
 * ML Game Optimization Response
 */
export interface MLOptimizeGameResponse {
  success: boolean;
  gameId: string;
  optimizationType: "network" | "system" | "both" | "none";
  improvements?: {
    latency?: number;
    fps?: number;
    stability?: number;
  };
}

/**
 * ML Game Optimization Options
 */
export interface MLOptimizationOptions {
  optimizeRoutes?: boolean;
  optimizeSettings?: boolean;
  optimizeSystem?: boolean;
  aggressiveness?: 'low' | 'medium' | 'high';
  systemInfo?: any;
}
