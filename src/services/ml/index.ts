
// Export ML API modules
export * from './mlApiClient';

// Export types explicitly to avoid duplicate exports
export type {
  MLRouteOptimizerResponse,
  MLPerformancePredictorResponse,
  MLDetectedGamesResponse,
  MLOptimizeGameResponse,
  MLConnectivityTestResult,
  MLRedirectProtectionResult,
  MLExtensionCheckResult,
  MLUrlTestResult
} from './types';

export * from './mlUrlDiagnostics';

// Re-export the mlService module for backward compatibility
// when imported directly through lazy loading
export * from './mlService';
