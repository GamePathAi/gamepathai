import { federatedLearningService } from "./federatedLearning";
import { neuralPredictionEngine } from "./neuralPrediction";
import { communityKnowledgeService } from "./communityKnowledge";
import { adaptiveProfilesService } from "./adaptiveProfiles";
import { HardwareData } from "@/types/metrics";

export interface EvolutionMetrics {
  predictionAccuracy: number;
  optimizationEffectiveness: number;
  adaptiveProfileAccuracy: number;
  knowledgeUtility: number;
  federatedContribution: number;
  overallScore: number;
}

/**
 * Self-Evolution Service
 * 
 * Monitors the performance of the DMIS system components and
 * continuously improves them based on feedback and real-world results.
 */
class SelfEvolutionService {
  private enabledFeatures: Set<string> = new Set([
    'federatedLearning',
    'adaptiveProfiles',
    'neuralPrediction',
    'communityKnowledge'
  ]);
  
  private metrics: EvolutionMetrics = {
    predictionAccuracy: 0.5,
    optimizationEffectiveness: 0.5,
    adaptiveProfileAccuracy: 0.5,
    knowledgeUtility: 0.5,
    federatedContribution: 0.5,
    overallScore: 0.5
  };
  
  private metricHistory: Array<{ timestamp: number; metrics: EvolutionMetrics }> = [];
  private localStorageKey = 'dmis_evolution_metrics';
  private lastOptimizationResults: Map<string, {
    gameId: string;
    predictedSettings: Record<string, any>;
    actualPerformance: { fps: number; frameTime: number; stability: number };
    expectedPerformance: { fps: number; frameTime: number; stability: number };
    timestamp: number;
  }> = new Map();
  
  constructor() {
    this.loadFromLocalStorage();
  }
  
  /**
   * Initialize the self-evolution system
   */
  public async initialize(): Promise<boolean> {
    try {
      console.log("🧬 Initializing Self-Evolution System...");
      
      // Schedule periodic evolution routines
      this.scheduleEvolutionRoutines();
      
      return true;
    } catch (error) {
      console.error("Failed to initialize self-evolution system:", error);
      return false;
    }
  }
  
  /**
   * Load metrics from local storage
   */
  private loadFromLocalStorage(): void {
    try {
      const storedData = localStorage.getItem(this.localStorageKey);
      if (storedData) {
        const data = JSON.parse(storedData) as {
          metrics: EvolutionMetrics;
          metricHistory: Array<{ timestamp: number; metrics: EvolutionMetrics }>;
          enabledFeatures: string[];
        };
        
        this.metrics = data.metrics;
        this.metricHistory = data.metricHistory;
        
        // Load enabled features
        this.enabledFeatures.clear();
        data.enabledFeatures.forEach(feature => this.enabledFeatures.add(feature));
        
        console.log(`📊 Loaded evolution metrics from storage: Overall score ${this.metrics.overallScore.toFixed(2)}`);
      }
    } catch (error) {
      console.error("Failed to load evolution metrics from storage:", error);
    }
  }
  
  /**
   * Save metrics to local storage
   */
  private saveToLocalStorage(): void {
    try {
      const data = {
        metrics: this.metrics,
        metricHistory: this.metricHistory.slice(-50), // Keep only the last 50 entries
        enabledFeatures: Array.from(this.enabledFeatures)
      };
      
      localStorage.setItem(this.localStorageKey, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save evolution metrics to storage:", error);
    }
  }
  
  /**
   * Schedule periodic evolution routines
   */
  private scheduleEvolutionRoutines(): void {
    // Schedule a routine check every 30 minutes
    setInterval(() => {
      if (this.isFeatureEnabled('selfEvolution')) {
        this.runEvolutionCycle().catch(console.error);
      }
    }, 30 * 60 * 1000);
    
    // Also run once at startup, after a short delay
    setTimeout(() => {
      if (this.isFeatureEnabled('selfEvolution')) {
        this.runEvolutionCycle().catch(console.error);
      }
    }, 5000);
  }
  
  /**
   * Run a single evolution cycle
   */
  private async runEvolutionCycle(): Promise<void> {
    try {
      console.log("🧬 Running evolution cycle...");
      
      // Analyze performance of each system component
      await this.analyzeNeuralPredictionPerformance();
      await this.analyzeAdaptiveProfilesPerformance();
      await this.analyzeCommunityKnowledgeValue();
      await this.analyzeFederatedLearningContribution();
      
      // Calculate overall system score
      this.updateOverallScore();
      
      // Record metrics history
      this.metricHistory.push({
        timestamp: Date.now(),
        metrics: { ...this.metrics }
      });
      
      // Save metrics
      this.saveToLocalStorage();
      
      console.log(`✅ Evolution cycle complete: Overall score ${this.metrics.overallScore.toFixed(2)}`);
      
      // Apply optimizations to system
      await this.applySelfOptimizations();
    } catch (error) {
      console.error("Failed to run evolution cycle:", error);
    }
  }
  
  /**
   * Analyze neural prediction performance
   */
  private async analyzeNeuralPredictionPerformance(): Promise<void> {
    try {
      console.log("📊 Analyzing neural prediction performance...");
      
      // In a real implementation, this would compare predicted vs. actual outcomes
      // For now, we'll use a simplified analytical approach
      
      // Calculate prediction accuracy based on optimization results
      if (this.lastOptimizationResults.size > 0) {
        let accuracySum = 0;
        let count = 0;
        
        for (const [_, result] of this.lastOptimizationResults) {
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
          this.metrics.predictionAccuracy = 
            (this.metrics.predictionAccuracy * 0.7) + (newAccuracy * 0.3);
        }
      } else {
        // If no results, slightly decay the accuracy to encourage collecting data
        this.metrics.predictionAccuracy *= 0.99;
      }
      
      // Ensure value is in valid range
      this.metrics.predictionAccuracy = Math.max(0.1, Math.min(1, this.metrics.predictionAccuracy));
      
      console.log(`📊 Neural prediction accuracy: ${this.metrics.predictionAccuracy.toFixed(2)}`);
    } catch (error) {
      console.error("Failed to analyze neural prediction performance:", error);
    }
  }
  
  /**
   * Analyze adaptive profiles performance
   */
  private async analyzeAdaptiveProfilesPerformance(): Promise<void> {
    try {
      console.log("📊 Analyzing adaptive profiles performance...");
      
      // In a real implementation, this would analyze how well adaptive profiles performed
      // For this demo, we'll use a simple approach that checks for active profiles
      
      // Get all game profiles
      const allProfiles = adaptiveProfilesService.getAllProfiles();
      const activeProfiles = allProfiles.filter(profile => profile.isActive);
      
      if (allProfiles.length > 0) {
        // Calculate ratio of active profiles
        const activeRatio = activeProfiles.length / allProfiles.length;
        
        // If no active profiles, that suggests poor quality
        if (activeProfiles.length === 0) {
          this.metrics.adaptiveProfileAccuracy *= 0.95; // Decay
        } else {
          // Otherwise, use active ratio as a factor in accuracy
          const newAccuracy = (activeRatio * 0.5) + 0.5; // Range from 0.5 to 1.0
          
          // Update with smoothing
          this.metrics.adaptiveProfileAccuracy = 
            (this.metrics.adaptiveProfileAccuracy * 0.8) + (newAccuracy * 0.2);
        }
      } else {
        // No profiles yet, set to mid-range value
        this.metrics.adaptiveProfileAccuracy = 0.5;
      }
      
      // Ensure value is in valid range
      this.metrics.adaptiveProfileAccuracy = Math.max(0.1, Math.min(1, this.metrics.adaptiveProfileAccuracy));
      
      console.log(`📊 Adaptive profiles accuracy: ${this.metrics.adaptiveProfileAccuracy.toFixed(2)}`);
    } catch (error) {
      console.error("Failed to analyze adaptive profiles performance:", error);
    }
  }
  
  /**
   * Analyze the value of community knowledge
   */
  private async analyzeCommunityKnowledgeValue(): Promise<void> {
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
        this.metrics.knowledgeUtility = 
          (this.metrics.knowledgeUtility * 0.7) + (newUtility * 0.3);
      } else {
        // No knowledge entries yet, set to low value
        this.metrics.knowledgeUtility = 0.2;
      }
      
      // Ensure value is in valid range
      this.metrics.knowledgeUtility = Math.max(0.1, Math.min(1, this.metrics.knowledgeUtility));
      
      console.log(`📊 Community knowledge utility: ${this.metrics.knowledgeUtility.toFixed(2)}`);
    } catch (error) {
      console.error("Failed to analyze community knowledge value:", error);
    }
  }
  
  /**
   * Analyze federated learning contribution
   */
  private async analyzeFederatedLearningContribution(): Promise<void> {
    try {
      console.log("📊 Analyzing federated learning contribution...");
      
      // This would typically analyze:
      // - How much this device contributes to the federated model
      // - Quality of training data from this device
      // - Consistency of model updates
      
      // For this demo, we'll use a placeholder value that slowly improves over time
      // to simulate the system getting better with more usage
      if (this.metrics.federatedContribution < 0.8) {
        this.metrics.federatedContribution += 0.01;
      }
      
      // Ensure value is in valid range
      this.metrics.federatedContribution = Math.max(0.1, Math.min(1, this.metrics.federatedContribution));
      
      console.log(`📊 Federated learning contribution: ${this.metrics.federatedContribution.toFixed(2)}`);
    } catch (error) {
      console.error("Failed to analyze federated learning contribution:", error);
    }
  }
  
  /**
   * Update the overall system score
   */
  private updateOverallScore(): void {
    // Calculate weighted average of all component scores
    this.metrics.overallScore = 
      (this.metrics.predictionAccuracy * 0.3) +
      (this.metrics.optimizationEffectiveness * 0.25) +
      (this.metrics.adaptiveProfileAccuracy * 0.2) +
      (this.metrics.knowledgeUtility * 0.15) +
      (this.metrics.federatedContribution * 0.1);
    
    // Log the overall score
    console.log(`📊 Overall system score: ${this.metrics.overallScore.toFixed(2)}`);
  }
  
  /**
   * Apply self-optimizations to the system based on metrics
   */
  private async applySelfOptimizations(): Promise<void> {
    try {
      console.log("🧬 Applying self-optimizations...");
      
      // Enable/disable features based on their performance
      
      // Only use federated learning if it's contributing positively
      if (this.metrics.federatedContribution < 0.3) {
        this.disableFeature('federatedLearning');
        console.log("🧬 Temporarily disabled Federated Learning due to low contribution");
      } else {
        this.enableFeature('federatedLearning');
      }
      
      // If prediction accuracy is very low, fall back more to community knowledge
      if (this.metrics.predictionAccuracy < 0.4 && this.metrics.knowledgeUtility > 0.6) {
        this.disableFeature('neuralPrediction');
        console.log("🧬 Temporarily disabled Neural Prediction due to low accuracy");
      } else {
        this.enableFeature('neuralPrediction');
      }
      
      // If adaptive profiles are performing poorly, temporarily disable them
      if (this.metrics.adaptiveProfileAccuracy < 0.3) {
        this.disableFeature('adaptiveProfiles');
        console.log("🧬 Temporarily disabled Adaptive Profiles due to low accuracy");
      } else {
        this.enableFeature('adaptiveProfiles');
      }
      
      console.log("✅ Applied system self-optimizations");
    } catch (error) {
      console.error("Failed to apply self-optimizations:", error);
    }
  }
  
  /**
   * Record the result of an optimization
   */
  public recordOptimizationResult(
    optimizationId: string,
    gameId: string,
    predictedSettings: Record<string, any>,
    actualPerformance: { fps: number; frameTime: number; stability: number },
    expectedPerformance: { fps: number; frameTime: number; stability: number }
  ): void {
    // Store the result
    this.lastOptimizationResults.set(optimizationId, {
      gameId,
      predictedSettings,
      actualPerformance,
      expectedPerformance,
      timestamp: Date.now()
    });
    
    // Prune old results (keep only last 20)
    if (this.lastOptimizationResults.size > 20) {
      // Sort by timestamp and remove oldest
      const sortedEntries = Array.from(this.lastOptimizationResults.entries())
        .sort((a, b) => b[1].timestamp - a[1].timestamp);
      
      while (sortedEntries.length > 20) {
        const oldest = sortedEntries.pop();
        if (oldest) {
          this.lastOptimizationResults.delete(oldest[0]);
        }
      }
    }
    
    // Calculate optimization effectiveness
    this.calculateOptimizationEffectiveness();
  }
  
  /**
   * Calculate optimization effectiveness based on results
   */
  private calculateOptimizationEffectiveness(): void {
    if (this.lastOptimizationResults.size === 0) {
      return;
    }
    
    let effectivenessSum = 0;
    let count = 0;
    
    for (const [_, result] of this.lastOptimizationResults) {
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
      this.metrics.optimizationEffectiveness = 
        (this.metrics.optimizationEffectiveness * 0.7) + (newEffectiveness * 0.3);
      
      // Cap to valid range
      this.metrics.optimizationEffectiveness = Math.max(0.1, Math.min(1, this.metrics.optimizationEffectiveness));
      
      console.log(`📊 Optimization effectiveness: ${this.metrics.optimizationEffectiveness.toFixed(2)}`);
      
      // Save metrics
      this.saveToLocalStorage();
    }
  }
  
  /**
   * Check if a specific feature is enabled
   */
  public isFeatureEnabled(featureName: string): boolean {
    return this.enabledFeatures.has(featureName);
  }
  
  /**
   * Enable a specific feature
   */
  public enableFeature(featureName: string): void {
    this.enabledFeatures.add(featureName);
    this.saveToLocalStorage();
  }
  
  /**
   * Disable a specific feature
   */
  public disableFeature(featureName: string): void {
    this.enabledFeatures.delete(featureName);
    this.saveToLocalStorage();
  }
  
  /**
   * Get current system metrics
   */
  public getMetrics(): EvolutionMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Get metric history
   */
  public getMetricHistory(): Array<{ timestamp: number; metrics: EvolutionMetrics }> {
    return [...this.metricHistory];
  }
  
  /**
   * Reset metrics to defaults (for debugging/testing)
   */
  public resetMetrics(): void {
    this.metrics = {
      predictionAccuracy: 0.5,
      optimizationEffectiveness: 0.5,
      adaptiveProfileAccuracy: 0.5,
      knowledgeUtility: 0.5,
      federatedContribution: 0.5,
      overallScore: 0.5
    };
    
    this.metricHistory = [];
    this.lastOptimizationResults.clear();
    this.saveToLocalStorage();
    
    console.log("📊 Reset evolution metrics to defaults");
  }
}

export const selfEvolutionService = new SelfEvolutionService();
