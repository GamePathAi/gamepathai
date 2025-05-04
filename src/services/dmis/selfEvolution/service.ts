import { federatedLearningService } from "../federatedLearning";
import { neuralPredictionEngine } from "../neuralPrediction";
import { communityKnowledgeService } from "../communityKnowledge";
import { adaptiveProfilesService } from "../adaptiveProfiles";
import { EvolutionMetrics, OptimizationResult } from './types';
import { EvolutionStorage } from './storage';
import { MetricAnalyzer } from './metricAnalyzer';
import { SystemOptimizer } from './systemOptimizer';

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
    'communityKnowledge',
    'selfEvolution'
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
  private lastOptimizationResults: Map<string, OptimizationResult> = new Map();
  
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
      const data = EvolutionStorage.loadFromLocalStorage();
      
      this.metrics = data.metrics;
      this.metricHistory = data.metricHistory;
      
      // Load enabled features
      this.enabledFeatures.clear();
      data.enabledFeatures.forEach(feature => this.enabledFeatures.add(feature));
      
      console.log(`📊 Loaded evolution metrics from storage: Overall score ${this.metrics.overallScore.toFixed(2)}`);
    } catch (error) {
      console.error("Failed to load evolution metrics from storage:", error);
    }
  }
  
  /**
   * Save metrics to local storage
   */
  private saveToLocalStorage(): void {
    EvolutionStorage.saveToLocalStorage(
      this.metrics,
      this.metricHistory,
      this.enabledFeatures
    );
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
    this.metrics.predictionAccuracy = MetricAnalyzer.analyzeNeuralPredictionPerformance(
      this.lastOptimizationResults,
      this.metrics.predictionAccuracy
    );
  }
  
  /**
   * Analyze adaptive profiles performance
   */
  private async analyzeAdaptiveProfilesPerformance(): Promise<void> {
    this.metrics.adaptiveProfileAccuracy = MetricAnalyzer.analyzeAdaptiveProfilesPerformance(
      this.metrics.adaptiveProfileAccuracy
    );
  }
  
  /**
   * Analyze the value of community knowledge
   */
  private async analyzeCommunityKnowledgeValue(): Promise<void> {
    this.metrics.knowledgeUtility = MetricAnalyzer.analyzeCommunityKnowledgeValue(
      this.metrics.knowledgeUtility
    );
  }
  
  /**
   * Analyze federated learning contribution
   */
  private async analyzeFederatedLearningContribution(): Promise<void> {
    this.metrics.federatedContribution = MetricAnalyzer.analyzeFederatedLearningContribution(
      this.metrics.federatedContribution
    );
  }
  
  /**
   * Update the overall system score
   */
  private updateOverallScore(): void {
    this.metrics.overallScore = MetricAnalyzer.updateOverallScore(this.metrics);
  }
  
  /**
   * Apply self-optimizations to the system based on metrics
   */
  private async applySelfOptimizations(): Promise<void> {
    SystemOptimizer.applySelfOptimizations(
      this.metrics,
      this.enableFeature.bind(this),
      this.disableFeature.bind(this)
    );
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
    this.metrics.optimizationEffectiveness = MetricAnalyzer.calculateOptimizationEffectiveness(
      this.lastOptimizationResults,
      this.metrics.optimizationEffectiveness
    );
    
    // Save metrics after updating
    this.saveToLocalStorage();
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
