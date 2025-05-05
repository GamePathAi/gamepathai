import { EvolutionStorage } from './storage';
import { MetricAnalyzer } from './metricAnalyzer';
import { SystemOptimizer } from './systemOptimizer';
import { EvolutionMetrics, OptimizationResult } from './types';

/**
 * Self-Evolution Service
 * Manages the system's ability to adapt and improve itself based on performance data
 */
class SelfEvolutionService {
  private metrics: EvolutionMetrics;
  private metricHistory: Array<{ timestamp: number; metrics: EvolutionMetrics }>;
  private enabledFeatures: Set<string>;
  
  constructor() {
    // Load initial state from storage
    const storedData = EvolutionStorage.loadFromLocalStorage();
    this.metrics = storedData.metrics;
    this.metricHistory = storedData.metricHistory;
    this.enabledFeatures = new Set(storedData.enabledFeatures);
    
    console.log("🧬 Self-Evolution Service initialized");
  }
  
  /**
   * Initialize the self-evolution service
   */
  public async initialize(): Promise<boolean> {
    try {
      console.log("🧬 Initializing Self-Evolution Service...");
      
      // Load any necessary remote data
      // For now, we just return true since initialization is simple
      
      return true;
    } catch (error) {
      console.error("Failed to initialize self-evolution service:", error);
      return false;
    }
  }
  
  /**
   * Record optimization results for self-evolution
   */
  public recordOptimizationResult(
    optimizationId: string,
    gameId: string,
    predictedSettings: Record<string, any>,
    actualPerformance: { fps: number; frameTime: number; stability: number },
    expectedPerformance: { fps: number; frameTime: number; stability: number }
  ): void {
    try {
      console.log(`🧬 Recording optimization result: ${optimizationId}`);
      
      // Create optimization result object
      const result: OptimizationResult = {
        gameId,
        predictedSettings,
        actualPerformance,
        expectedPerformance,
        timestamp: Date.now()
      };
      
      // Submit the result through the existing method
      this.submitResults([result]);
      
    } catch (error) {
      console.error("Failed to record optimization result:", error);
    }
  }
  
  /**
   * Get current metrics
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
   * Check if a feature is enabled
   */
  public isFeatureEnabled(featureName: string): boolean {
    return this.enabledFeatures.has(featureName);
  }
  
  /**
   * Get list of all enabled features
   */
  public getEnabledFeatures(): string[] {
    return Array.from(this.enabledFeatures);
  }
  
  /**
   * Enable a feature
   */
  public enableFeature(featureName: string): void {
    if (!this.enabledFeatures.has(featureName)) {
      console.log(`🧬 Enabling feature: ${featureName}`);
      this.enabledFeatures.add(featureName);
      this.saveState();
    }
  }
  
  /**
   * Disable a feature
   */
  public disableFeature(featureName: string): void {
    if (this.enabledFeatures.has(featureName)) {
      console.log(`🧬 Disabling feature: ${featureName}`);
      this.enabledFeatures.delete(featureName);
      this.saveState();
    }
  }
  
  /**
   * Submit optimization results to improve the system
   */
  public submitResults(results: OptimizationResult[]): void {
    try {
      console.log("🧬 Processing optimization results...");
      
      // Update metrics based on results
      this.metrics = MetricAnalyzer.updateMetrics(this.metrics, results);
      
      // Add to history
      this.metricHistory.push({
        timestamp: Date.now(),
        metrics: { ...this.metrics }
      });
      
      // Limit history size
      if (this.metricHistory.length > 50) {
        this.metricHistory = this.metricHistory.slice(-50);
      }
      
      // Apply self-optimizations based on metrics
      this.applySelfOptimizations();
      
      // Save state
      this.saveState();
      
      console.log("✅ Self-evolution cycle completed");
    } catch (error) {
      console.error("Failed to process optimization results:", error);
    }
  }
  
  /**
   * Apply self-optimizations based on current metrics
   */
  private applySelfOptimizations(): void {
    SystemOptimizer.applySelfOptimizations(
      this.metrics,
      (featureName) => this.enableFeature(featureName),
      (featureName) => this.disableFeature(featureName)
    );
  }
  
  /**
   * Save current state to storage
   */
  private saveState(): void {
    EvolutionStorage.saveToLocalStorage(
      this.metrics,
      this.metricHistory,
      this.enabledFeatures
    );
  }
  
  /**
   * Reset metrics to defaults
   */
  public resetMetrics(): void {
    const defaultMetrics: EvolutionMetrics = {
      predictionAccuracy: 0.5,
      optimizationEffectiveness: 0.5,
      adaptiveProfileAccuracy: 0.5,
      knowledgeUtility: 0.5,
      federatedContribution: 0.5,
      overallScore: 0.5
    };
    
    this.metrics = defaultMetrics;
    this.metricHistory = [];
    this.saveState();
    console.log("🧬 Metrics have been reset to defaults");
  }
}

// Singleton instance
export const selfEvolutionService = new SelfEvolutionService();
