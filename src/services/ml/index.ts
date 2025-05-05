
// Export ML API modules
export * from './mlApiClient';
export * from './mlService';

// Export types explicitly to avoid duplicate exports
export type {
  MLRouteOptimizerResponse,
  MLPerformancePredictorResponse,
  MLDetectedGamesResponse,
  MLOptimizeGameResponse
} from './types';

export * from './mlUrlDiagnostics';
