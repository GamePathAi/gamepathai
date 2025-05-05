
// Export ML API modules
export * from './mlApiClient';
export * from './mlApiTypes';
export * from './mlDiagnostics';
export { mlCache, CACHE_TTL } from './mlCacheManager'; // Export from the core implementation

// Export specialized service modules
export * from './routeOptimizer';
export * from './performancePredictor';
export * from './gameDetection';
export * from './gameOptimizer';
export * from './cacheService';
export * from './diagnosticService';

// Export types explicitly
export type {
  MLConnectivityTestResult,
  MLRedirectProtectionResult,
  MLExtensionCheckResult,
  MLUrlTestResult
} from './types';

export type {
  MLRouteOptimizerResponse,
  MLPerformancePredictorResponse,
  MLDetectedGamesResponse,
  MLOptimizeGameResponse,
  MLOptimizationOptions
} from './types';

export * from './mlUrlDiagnostics';
export * from './mlService';
