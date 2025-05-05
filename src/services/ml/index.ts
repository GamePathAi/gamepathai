
// Export ML API modules
export * from './mlApiClient';

// Instead of re-exporting mlDiagnostics from mlApiClient, we're now importing it from mlDiagnostics file
// export * from './mlDiagnostics'; - This was causing duplicated export

// We need to explicitly export from mlDiagnostics to avoid conflicts
export { mlDiagnostics } from './mlDiagnostics';

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
