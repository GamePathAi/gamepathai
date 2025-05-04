
import { EvolutionMetrics } from './types';

/**
 * Handles automatic optimization of the system based on performance metrics
 */
export class SystemOptimizer {
  /**
   * Apply self-optimizations to the system based on metrics
   */
  public static applySelfOptimizations(
    metrics: EvolutionMetrics,
    enableFeature: (featureName: string) => void,
    disableFeature: (featureName: string) => void
  ): void {
    try {
      console.log("🧬 Applying self-optimizations...");
      
      // Enable/disable features based on their performance
      
      // Only use federated learning if it's contributing positively
      if (metrics.federatedContribution < 0.3) {
        disableFeature('federatedLearning');
        console.log("🧬 Temporarily disabled Federated Learning due to low contribution");
      } else {
        enableFeature('federatedLearning');
      }
      
      // If prediction accuracy is very low, fall back more to community knowledge
      if (metrics.predictionAccuracy < 0.4 && metrics.knowledgeUtility > 0.6) {
        disableFeature('neuralPrediction');
        console.log("🧬 Temporarily disabled Neural Prediction due to low accuracy");
      } else {
        enableFeature('neuralPrediction');
      }
      
      // If adaptive profiles are performing poorly, temporarily disable them
      if (metrics.adaptiveProfileAccuracy < 0.3) {
        disableFeature('adaptiveProfiles');
        console.log("🧬 Temporarily disabled Adaptive Profiles due to low accuracy");
      } else {
        enableFeature('adaptiveProfiles');
      }
      
      console.log("✅ Applied system self-optimizations");
    } catch (error) {
      console.error("Failed to apply self-optimizations:", error);
    }
  }
}
