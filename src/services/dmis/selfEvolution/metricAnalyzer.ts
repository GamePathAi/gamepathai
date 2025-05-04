import { EvolutionMetrics, OptimizationResult } from './types';
import { communityKnowledgeService } from '../communityKnowledge';
import { adaptiveProfilesService } from '../adaptiveProfiles';

/**
 * Handles the analysis of various system metrics
 */
export class MetricAnalyzer {
  /**
   * Analyze neural prediction performance
   */
  public static analyzeNeuralPredictionPerformance(
    lastOptimizationResults: Map<string, OptimizationResult>,
    currentMetric: number
  ): number {
    try {
      console.log("📊 Analyzing neural prediction performance...");
      
      // Calculate prediction accuracy based on optimization results
      if (lastOptimizationResults.size > 0) {
        let accuracySum = 0;
        let count = 0;
        
        for (const [_, result] of lastOptimizationResults) {
          // Calculate how close the actual performance was to the expected performance
          const fpsDiff = Math.abs(result.actualPerformance.fps - result.expectedPerformance.fps);
          const fpsAccuracy = Math.max(0, 1 - (fpsDiff / result.expectedPerformance.fps));
          
          // Stability comparison
          const stabilityDiff = Math.abs(
            result.actualPerformance.stability - result.expectedPerformance.stability
          );
          const stabilityAccuracy = Math.max(0, 1 - stabilityDiff);
          
          // Overall accuracy for this result
          const resultAccuracy = (fpsAccuracy * 0.7) + (stabilityAccuracy * 0.3);
          accuracySum += resultAccuracy;
          count++;
        }
        
        if (count > 0) {
          // Calculate new accuracy with decay from old value (smooth transitions)
          const newAccuracy = accuracySum / count;
          currentMetric = (currentMetric * 0.7) + (newAccuracy * 0.3);
        }
      } else {
        // If no results, slightly decay the accuracy to encourage collecting data
        currentMetric *= 0.99;
      }
      
      // Ensure value is in valid range
      currentMetric = Math.max(0.1, Math.min(1, currentMetric));
      
      console.log(`📊 Neural prediction accuracy: ${currentMetric.toFixed(2)}`);
      return currentMetric;
      
    } catch (error) {
      console.error("Failed to analyze neural prediction performance:", error);
      return currentMetric;
    }
  }
  
  /**
   * Analyze adaptive profiles performance
   */
  public static analyzeAdaptiveProfilesPerformance(currentMetric: number): number {
    try {
      console.log("📊 Analyzing adaptive profiles performance...");
      
      // Get all game profiles
      const allProfiles = adaptiveProfilesService.getAllProfiles();
      const activeProfiles = allProfiles.filter(profile => profile.isActive);
      
      if (allProfiles.length > 0) {
        // Calculate ratio of active profiles
        const activeRatio = activeProfiles.length / allProfiles.length;
        
        // If no active profiles, that suggests poor quality
        if (activeProfiles.length === 0) {
          currentMetric *= 0.95; // Decay
        } else {
          // Otherwise, use active ratio as a factor in accuracy
          const newAccuracy = (activeRatio * 0.5) + 0.5; // Range from 0.5 to 1.0
          
          // Update with smoothing
          currentMetric = (currentMetric * 0.8) + (newAccuracy * 0.2);
        }
      } else {
        // No profiles yet, set to mid-range value
        currentMetric = 0.5;
      }
      
      // Ensure value is in valid range
      currentMetric = Math.max(0.1, Math.min(1, currentMetric));
      
      console.log(`📊 Adaptive profiles accuracy: ${currentMetric.toFixed(2)}`);
      return currentMetric;
      
    } catch (error) {
      console.error("Failed to analyze adaptive profiles performance:", error);
      return currentMetric;
    }
  }
  
  /**
   * Analyze the value of community knowledge
   */
  public static analyzeCommunityKnowledgeValue(currentMetric: number): number {
    try {
      console.log("📊 Analyzing community knowledge value...");
      
      // Get knowledge statistics
      const knowledgeStats = communityKnowledgeService.getKnowledgeStats();
      
      if (knowledgeStats.totalEntries > 0) {
        // Calculate score based on:
        // - Number of entries (more is better)
        // - Recency of entries (more recent is better)
        // - Verification rate (more verified entries is better)
        
        // Entry count factor (sigmoid curve that saturates around 100 entries)
        const entriesScore = 1 / (1 + Math.exp(-0.05 * (knowledgeStats.totalEntries - 50)));
        
        // Recency factor
        const recencyScore = knowledgeStats.recentEntriesCount / Math.max(1, knowledgeStats.totalEntries);
        
        // Verification factor
        const verificationScore = knowledgeStats.verifiedEntriesCount / Math.max(1, knowledgeStats.totalEntries);
        
        // Combined score
        const newUtility = 
          (entriesScore * 0.4) + 
          (recencyScore * 0.3) + 
          (verificationScore * 0.3);
        
        // Update with smoothing
        currentMetric = (currentMetric * 0.7) + (newUtility * 0.3);
      } else {
        // No knowledge entries yet, set to low value
        currentMetric = 0.2;
      }
      
      // Ensure value is in valid range
      currentMetric = Math.max(0.1, Math.min(1, currentMetric));
      
      console.log(`📊 Community knowledge utility: ${currentMetric.toFixed(2)}`);
      return currentMetric;
      
    } catch (error) {
      console.error("Failed to analyze community knowledge value:", error);
      return currentMetric;
    }
  }
  
  /**
   * Analyze federated learning contribution
   */
  public static analyzeFederatedLearningContribution(currentMetric: number): number {
    try {
      console.log("📊 Analyzing federated learning contribution...");
      
      // This would typically analyze:
      // - How much this device contributes to the federated model
      // - Quality of training data from this device
      // - Consistency of model updates
      
      // For this demo, we'll use a placeholder value that slowly improves over time
      // to simulate the system getting better with more usage
      if (currentMetric < 0.8) {
        currentMetric += 0.01;
      }
      
      // Ensure value is in valid range
      currentMetric = Math.max(0.1, Math.min(1, currentMetric));
      
      console.log(`📊 Federated learning contribution: ${currentMetric.toFixed(2)}`);
      return currentMetric;
      
    } catch (error) {
      console.error("Failed to analyze federated learning contribution:", error);
      return currentMetric;
    }
  }
  
  /**
   * Calculate optimization effectiveness based on results
   */
  public static calculateOptimizationEffectiveness(
    lastOptimizationResults: Map<string, OptimizationResult>,
    currentEffectiveness: number
  ): number {
    if (lastOptimizationResults.size === 0) {
      return currentEffectiveness;
    }
    
    let effectivenessSum = 0;
    let count = 0;
    
    for (const [_, result] of lastOptimizationResults) {
      // Calculate FPS improvement ratio
      const targetFps = result.expectedPerformance.fps;
      const actualFps = result.actualPerformance.fps;
      let fpsEffectiveness = 0;
      
      if (targetFps >= 0 && actualFps >= 0) {
        // If actual FPS met or exceeded target, that's great
        if (actualFps >= targetFps) {
          fpsEffectiveness = 1.0;
        } else {
          // Otherwise, calculate how close we got
          fpsEffectiveness = Math.max(0, actualFps / targetFps);
        }
      }
      
      // Calculate stability effectiveness
      const targetStability = result.expectedPerformance.stability;
      const actualStability = result.actualPerformance.stability;
      let stabilityEffectiveness = 0;
      
      if (targetStability >= 0 && actualStability >= 0) {
        // Similar to FPS, but stability values are already normalized
        stabilityEffectiveness = Math.max(0, actualStability / targetStability);
      }
      
      // Overall effectiveness for this result
      const resultEffectiveness = (fpsEffectiveness * 0.7) + (stabilityEffectiveness * 0.3);
      effectivenessSum += resultEffectiveness;
      count++;
    }
    
    if (count > 0) {
      // Calculate new effectiveness with decay from old value (smooth transitions)
      const newEffectiveness = effectivenessSum / count;
      currentEffectiveness = 
        (currentEffectiveness * 0.7) + (newEffectiveness * 0.3);
      
      // Cap to valid range
      currentEffectiveness = Math.max(0.1, Math.min(1, currentEffectiveness));
      
      console.log(`📊 Optimization effectiveness: ${currentEffectiveness.toFixed(2)}`);
    }
    
    return currentEffectiveness;
  }
  
  /**
   * Update the overall system score
   */
  public static updateOverallScore(metrics: EvolutionMetrics): number {
    // Calculate weighted average of all component scores
    const overallScore = 
      (metrics.predictionAccuracy * 0.3) +
      (metrics.optimizationEffectiveness * 0.25) +
      (metrics.adaptiveProfileAccuracy * 0.2) +
      (metrics.knowledgeUtility * 0.15) +
      (metrics.federatedContribution * 0.1);
    
    // Log the overall score
    console.log(`📊 Overall system score: ${overallScore.toFixed(2)}`);
    
    return overallScore;
  }
}
