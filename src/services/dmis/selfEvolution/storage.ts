
import { EvolutionMetrics, EvolutionStorageData } from './types';

/**
 * Handles local storage operations for evolution metrics
 */
export class EvolutionStorage {
  private static LOCAL_STORAGE_KEY = 'dmis_evolution_metrics';
  
  /**
   * Load evolution metrics from local storage
   */
  public static loadFromLocalStorage(): {
    metrics: EvolutionMetrics;
    metricHistory: Array<{ timestamp: number; metrics: EvolutionMetrics }>;
    enabledFeatures: string[];
  } {
    const defaultMetrics: EvolutionMetrics = {
      predictionAccuracy: 0.5,
      optimizationEffectiveness: 0.5,
      adaptiveProfileAccuracy: 0.5,
      knowledgeUtility: 0.5,
      federatedContribution: 0.5,
      overallScore: 0.5
    };
    
    try {
      const storedData = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (storedData) {
        const data = JSON.parse(storedData) as EvolutionStorageData;
        
        return {
          metrics: data.metrics,
          metricHistory: data.metricHistory,
          enabledFeatures: data.enabledFeatures
        };
      }
    } catch (error) {
      console.error("Failed to load evolution metrics from storage:", error);
    }
    
    return {
      metrics: defaultMetrics,
      metricHistory: [],
      enabledFeatures: [
        'federatedLearning',
        'adaptiveProfiles',
        'neuralPrediction',
        'communityKnowledge',
        'selfEvolution'
      ]
    };
  }
  
  /**
   * Save evolution metrics to local storage
   */
  public static saveToLocalStorage(
    metrics: EvolutionMetrics,
    metricHistory: Array<{ timestamp: number; metrics: EvolutionMetrics }>,
    enabledFeatures: Set<string>
  ): void {
    try {
      const data: EvolutionStorageData = {
        metrics,
        metricHistory: metricHistory.slice(-50), // Keep only the last 50 entries
        enabledFeatures: Array.from(enabledFeatures)
      };
      
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save evolution metrics to storage:", error);
    }
  }
}
