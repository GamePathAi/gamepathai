
/**
 * Type definitions for the Self-Evolution system
 */

export interface EvolutionMetrics {
  predictionAccuracy: number;
  optimizationEffectiveness: number;
  adaptiveProfileAccuracy: number;
  knowledgeUtility: number;
  federatedContribution: number;
  overallScore: number;
}

export interface OptimizationResult {
  gameId: string;
  predictedSettings: Record<string, any>;
  actualPerformance: { fps: number; frameTime: number; stability: number };
  expectedPerformance: { fps: number; frameTime: number; stability: number };
  timestamp: number;
}

export interface EvolutionStorageData {
  metrics: EvolutionMetrics;
  metricHistory: Array<{ timestamp: number; metrics: EvolutionMetrics }>;
  enabledFeatures: string[];
}
