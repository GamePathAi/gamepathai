
/**
 * Type definitions for ML API
 */

/**
 * ML API Error response
 */
export interface MLApiError {
  status: string | number;
  message: string;
  details?: string;
  originalError?: any;
}

/**
 * ML Route Optimizer Response
 */
export interface MLRouteOptimizerResponse {
  success: boolean;
  optimizedRoutes: {
    route: string;
    latency: number;
    jitter: number;
    packetLoss: number;
    improvement: number;
  }[];
  recommendations: {
    type: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }[];
}

/**
 * ML Performance Predictor Response
 */
export interface MLPerformancePredictorResponse {
  success: boolean;
  recommendations: {
    setting: string;
    currentValue: string | number;
    recommendedValue: string | number;
    impact: number;
  }[];
  expectedGains: {
    fps: number;
    stability: number;
  };
}

/**
 * ML Detected Games Response
 */
export interface MLDetectedGamesResponse {
  detectedGames: {
    id: string;
    name: string;
    type?: string;
    executable?: string;
    installPath?: string;
  }[];
}

/**
 * ML Optimize Game Response
 */
export interface MLOptimizeGameResponse {
  success: boolean;
  optimizationType?: "network" | "system" | "both" | "none";
  improvements?: {
    latency?: number;
    fps?: number;
    stability?: number;
  };
}

/**
 * ML Connectivity Test Result
 */
export interface MLConnectivityTestResult {
  success: boolean;
  results: Record<string, { success: boolean, error?: string }>;
}

/**
 * ML Redirect Protection Result
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
