import { EvolutionMetrics, OptimizationResult } from './types';

/**
 * Analyzes system metrics to calculate performance and accuracy scores
 */
export class MetricAnalyzer {
  /**
   * Calculate accuracy metrics based on predicted vs. actual performance
   */
  public static calculatePredictionAccuracy(results: OptimizationResult[]): number {
    if (!results || results.length === 0) {
      return 0.5; // Default baseline when no data available
    }
    
    let accuracySum = 0;
    
    results.forEach(result => {
      // Calculate deviation between predicted and actual performance
      const fpsDifference = Math.abs(result.actualPerformance.fps - result.expectedPerformance.fps);
      const fpsAccuracy = Math.max(0, 1 - (fpsDifference / result.expectedPerformance.fps));
      
      const frameDifference = Math.abs(result.actualPerformance.frameTime - result.expectedPerformance.frameTime);
      const frameAccuracy = Math.max(0, 1 - (frameDifference / result.expectedPerformance.frameTime));
      
      const stabilityDifference = Math.abs(result.actualPerformance.stability - result.expectedPerformance.stability);
      const stabilityAccuracy = Math.max(0, 1 - stabilityDifference);
      
      // Overall accuracy for this result
      const resultAccuracy = (fpsAccuracy + frameAccuracy + stabilityAccuracy) / 3;
      accuracySum += resultAccuracy;
    });
    
    // Calculate average accuracy across all results
    return Math.min(1, Math.max(0, accuracySum / results.length));
  }
  
  /**
   * Calculate optimization effectiveness
   */
  public static calculateOptimizationEffectiveness(results: OptimizationResult[]): number {
    if (!results || results.length === 0) {
      return 0.5; // Default baseline when no data available
    }
    
    // Logic for calculating optimization effectiveness
    // Higher is better
    return 0.7; // Placeholder value
  }
  
  /**
   * Calculate the overall system performance based on individual metrics
   */
  public static calculateOverallScore(metrics: EvolutionMetrics): number {
    // Weighting factors for different metrics
    const weights = {
      predictionAccuracy: 0.35,
      optimizationEffectiveness: 0.25,
      adaptiveProfileAccuracy: 0.15,
      knowledgeUtility: 0.15,
      federatedContribution: 0.10
    };
    
    // Calculate weighted average
    const weightedScore = 
      metrics.predictionAccuracy * weights.predictionAccuracy +
      metrics.optimizationEffectiveness * weights.optimizationEffectiveness +
      metrics.adaptiveProfileAccuracy * weights.adaptiveProfileAccuracy +
      metrics.knowledgeUtility * weights.knowledgeUtility +
      metrics.federatedContribution * weights.federatedContribution;
    
    // Ensure the score is between 0 and 1
    return Math.min(1, Math.max(0, weightedScore));
  }
  
  /**
   * Update system metrics based on optimization results
   * IMPROVED: Added resilience to handle missing or invalid data
   */
  public static updateMetrics(
    currentMetrics: EvolutionMetrics, 
    results: OptimizationResult[]
  ): EvolutionMetrics {
    try {
      // Calculate new values only if we have valid results
      const hasValidResults = Array.isArray(results) && results.length > 0;
      
      // Only update metrics that can be calculated
      const predictionAccuracy = hasValidResults
        ? this.calculatePredictionAccuracy(results)
        : currentMetrics.predictionAccuracy;
      
      const optimizationEffectiveness = hasValidResults
        ? this.calculateOptimizationEffectiveness(results)
        : currentMetrics.optimizationEffectiveness;
      
      // For metrics we can't calculate now, keep current values
      const adaptiveProfileAccuracy = currentMetrics.adaptiveProfileAccuracy;
      const knowledgeUtility = currentMetrics.knowledgeUtility;
      const federatedContribution = currentMetrics.federatedContribution;
      
      // Create updated metrics object
      const updatedMetrics: EvolutionMetrics = {
        predictionAccuracy,
        optimizationEffectiveness,
        adaptiveProfileAccuracy,
        knowledgeUtility,
        federatedContribution,
        overallScore: 0 // Will be calculated
      };
      
      // Calculate the overall score
      updatedMetrics.overallScore = this.calculateOverallScore(updatedMetrics);
      
      return updatedMetrics;
    } catch (error) {
      console.error("Error updating metrics:", error);
      // Return current metrics if there was an error
      return currentMetrics;
    }
  }
}
