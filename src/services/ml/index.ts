
// Export ML API modules
export * from './mlApiClient';

// Re-export mlDiagnostics explicitly from only one source to avoid ambiguity
export { mlDiagnostics } from './mlService'; 

// Export types explicitly to avoid duplicate exports
export type {
  MLRouteOptimizerResponse,
  MLPerformancePredictorResponse,
  MLDetectedGamesResponse,
  MLOptimizeGameResponse
} from './types';

export * from './mlUrlDiagnostics';
