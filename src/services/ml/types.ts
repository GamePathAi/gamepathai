
/**
 * Type definitions for ML API responses and options
 * This file centralizes all types used across the ML services
 */

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

/**
 * ML Connectivity Test Result
 */
export interface MLConnectivityTestResult {
  success: boolean;
  health?: boolean;
  results: Record<string, { success: boolean; error?: string }>;
}

/**
 * ML Redirect Protection Test Result
 */
export interface MLRedirectProtectionResult {
  protected: boolean;
  details: string;
}

/**
 * ML Extension Check Result
 */
export interface MLExtensionCheckResult {
  detected: boolean;
  extensions: string[];
}

/**
 * ML URL Test Result
 */
export interface MLUrlTestResult {
  wasRedirected: boolean;
  finalUrl: string;
  isGamePathAI: boolean;
  responseStatus?: number;
}
