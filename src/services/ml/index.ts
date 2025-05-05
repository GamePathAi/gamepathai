
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
  MLUrlTestResult,
  MLOptimizationOptions
} from './types';

export * from './mlUrlDiagnostics';

// Instead of re-exporting mlService directly, we'll let consumers import it dynamically
// to avoid circular dependencies
