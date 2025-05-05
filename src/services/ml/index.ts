
// Export ML API modules
export * from './mlApiClient';
export * from './mlApiTypes';
export { mlDiagnostics } from './mlDiagnostics';
export { mlCache, CACHE_TTL } from './mlCacheManager';

// Export types explicitly
export type {
  MLConnectivityTestResult,
  MLRedirectProtectionResult,
  MLExtensionCheckResult,
  MLUrlTestResult
} from './mlDiagnostics';

export type {
  MLRouteOptimizerResponse,
  MLPerformancePredictorResponse,
  MLDetectedGamesResponse,
  MLOptimizeGameResponse,
  MLOptimizationOptions
} from './types';

export * from './mlUrlDiagnostics';

// Instead of re-exporting mlService directly, we'll let consumers import it dynamically
// to avoid circular dependencies
