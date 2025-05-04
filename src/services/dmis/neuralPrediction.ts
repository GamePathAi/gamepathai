
import { HardwareData } from "@/types/metrics";
import { federatedLearningService } from "./federatedLearning";

export interface PredictionConfig {
  gameId?: string;
  confidence?: number;
  useCachedResults?: boolean;
  includeExplanations?: boolean;
}

export interface PredictionResult {
  predictions: Record<string, number>;
  confidence: number;
  explanations?: string[];
  timestamp: number;
}

/**
 * Multi-Dimensional Neural Prediction Engine
 * 
 * A service for making predictions about optimal game settings, hardware bottlenecks,
 * and performance improvements based on hardware metrics and user preferences.
 */
class NeuralPredictionEngine {
  private cachedPredictions: Map<string, PredictionResult> = new Map();
  private dimensionalModels: Map<string, string[]> = new Map();
  
  constructor() {
    this.initializeDimensionalModels();
  }
  
  /**
   * Initialize dimensional models mapping
   */
  private initializeDimensionalModels(): void {
    // Map dimensions to specific model IDs
    this.dimensionalModels.set("performance", ["game-optimizer-v1"]);
    this.dimensionalModels.set("bottlenecks", ["bottleneck-detector-v1"]);
    // Additional dimensions would be initialized here in a real implementation
  }
  
  /**
   * Predict optimal game settings based on hardware data
   */
  public async predictOptimalSettings(
    gameId: string, 
    hardwareData: HardwareData, 
    currentSettings: Record<string, any>,
    config: PredictionConfig = {}
  ): Promise<PredictionResult> {
    const cacheKey = `settings:${gameId}:${JSON.stringify(hardwareData)}`;
    
    // Check cache if enabled
    if (config.useCachedResults && this.cachedPredictions.has(cacheKey)) {
      return this.cachedPredictions.get(cacheKey)!;
    }
    
    try {
      console.log(`🔮 Predicting optimal settings for game: ${gameId}`);
      
      // Prepare input features
      const features = this.prepareGameSettingsFeatures(hardwareData, currentSettings);
      
      // Get the model ID for game optimization
      const modelId = this.dimensionalModels.get("performance")?.[0] || "game-optimizer-v1";
      
      // Make prediction using federated model
      const rawPredictions = federatedLearningService.predict(modelId, features);
      
      if (!rawPredictions) {
        throw new Error("Failed to get predictions from model");
      }
      
      // Transform raw predictions into settings
      const settingKeys = [
        "resolution", "graphics_quality", "antialiasing", 
        "shadows", "textures", "effects", "view_distance", "fps_cap"
      ];
      
      const predictions: Record<string, number> = {};
      rawPredictions.forEach((value, index) => {
        if (index < settingKeys.length) {
          predictions[settingKeys[index]] = value;
        }
      });
      
      // Generate explanations if requested
      const explanations = config.includeExplanations 
        ? this.generateSettingExplanations(predictions, hardwareData)
        : undefined;
      
      // Calculate confidence score
      const confidence = config.confidence || this.calculateConfidenceScore(hardwareData, gameId);
      
      const result: PredictionResult = {
        predictions,
        confidence,
        explanations,
        timestamp: Date.now()
      };
      
      // Cache the predictions
      this.cachedPredictions.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error("Error predicting optimal settings:", error);
      
      // Return a fallback prediction
      return {
        predictions: {
          resolution: 0.5,      // 1080p
          graphics_quality: 0.6, // Medium-high
          antialiasing: 0.5,     // 2x
          shadows: 0.4,          // Medium
          textures: 0.7,         // High
          effects: 0.5,          // Medium
          view_distance: 0.6,     // Medium-high
          fps_cap: 0.8           // 144fps
        },
        confidence: 0.5,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Predict hardware bottlenecks based on hardware metrics
   */
  public async predictBottlenecks(
    hardwareData: HardwareData,
    gameId?: string,
    config: PredictionConfig = {}
  ): Promise<PredictionResult> {
    const cacheKey = `bottlenecks:${gameId || "general"}:${JSON.stringify(hardwareData)}`;
    
    // Check cache if enabled
    if (config.useCachedResults && this.cachedPredictions.has(cacheKey)) {
      return this.cachedPredictions.get(cacheKey)!;
    }
    
    try {
      console.log(`🔍 Analyzing potential hardware bottlenecks${gameId ? ` for ${gameId}` : ""}`);
      
      // Prepare input features
      const features = this.prepareBottleneckFeatures(hardwareData);
      
      // Get the model ID for bottleneck detection
      const modelId = this.dimensionalModels.get("bottlenecks")?.[0] || "bottleneck-detector-v1";
      
      // Make prediction using federated model
      const rawPredictions = federatedLearningService.predict(modelId, features);
      
      if (!rawPredictions) {
        throw new Error("Failed to get predictions from model");
      }
      
      // Transform raw predictions into bottleneck probabilities
      const bottleneckTypes = ["cpu", "gpu", "memory", "disk"];
      const predictions: Record<string, number> = {};
      
      rawPredictions.forEach((value, index) => {
        if (index < bottleneckTypes.length) {
          predictions[bottleneckTypes[index]] = value;
        }
      });
      
      // Generate explanations if requested
      const explanations = config.includeExplanations 
        ? this.generateBottleneckExplanations(predictions, hardwareData)
        : undefined;
      
      // Calculate confidence score
      const confidence = config.confidence || this.calculateConfidenceScore(hardwareData, gameId);
      
      const result: PredictionResult = {
        predictions,
        confidence,
        explanations,
        timestamp: Date.now()
      };
      
      // Cache the predictions
      this.cachedPredictions.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error("Error predicting bottlenecks:", error);
      
      // Return fallback predictions
      return {
        predictions: {
          cpu: 0.3,
          gpu: 0.6,
          memory: 0.2,
          disk: 0.1
        },
        confidence: 0.5,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Prepare features vector for game settings prediction
   */
  private prepareGameSettingsFeatures(hardwareData: HardwareData, currentSettings: Record<string, any>): number[] {
    // Extract hardware metrics
    const features: number[] = [
      // CPU metrics
      hardwareData.cpu.usage / 100,
      hardwareData.cpu.temperature ? hardwareData.cpu.temperature / 100 : 0.5,
      
      // GPU metrics
      hardwareData.gpu?.usage ? hardwareData.gpu.usage / 100 : 0.5,
      hardwareData.gpu?.temperature ? hardwareData.gpu.temperature / 100 : 0.5,
      hardwareData.gpu?.memoryUsed && hardwareData.gpu.memoryTotal 
        ? hardwareData.gpu.memoryUsed / hardwareData.gpu.memoryTotal 
        : 0.5,
      
      // Memory metrics
      hardwareData.memory.usage / 100,
      hardwareData.memory.used / hardwareData.memory.total,
      
      // Current settings (normalized to 0-1)
      currentSettings.resolution !== undefined ? currentSettings.resolution : 0.5,
      currentSettings.graphics_quality !== undefined ? currentSettings.graphics_quality : 0.5,
      currentSettings.antialiasing !== undefined ? currentSettings.antialiasing : 0.5,
      currentSettings.shadows !== undefined ? currentSettings.shadows : 0.5,
      currentSettings.textures !== undefined ? currentSettings.textures : 0.5,
      currentSettings.effects !== undefined ? currentSettings.effects : 0.5,
      currentSettings.view_distance !== undefined ? currentSettings.view_distance : 0.5,
      currentSettings.fps_cap !== undefined ? currentSettings.fps_cap : 0.5,
    ];
    
    // Pad to expected length (24) with zeros if needed
    while (features.length < 24) {
      features.push(0);
    }
    
    return features;
  }
  
  /**
   * Prepare features vector for bottleneck prediction
   */
  private prepareBottleneckFeatures(hardwareData: HardwareData): number[] {
    // Extract hardware metrics
    const features: number[] = [
      // CPU metrics
      hardwareData.cpu.usage / 100,
      hardwareData.cpu.temperature ? hardwareData.cpu.temperature / 100 : 0.5,
      
      // GPU metrics
      hardwareData.gpu?.usage ? hardwareData.gpu.usage / 100 : 0.5,
      hardwareData.gpu?.temperature ? hardwareData.gpu.temperature / 100 : 0.5,
      hardwareData.gpu?.memoryUsed && hardwareData.gpu.memoryTotal 
        ? hardwareData.gpu.memoryUsed / hardwareData.gpu.memoryTotal 
        : 0.5,
      
      // Memory metrics
      hardwareData.memory.usage / 100,
      hardwareData.memory.used / hardwareData.memory.total,
      
      // Disk metrics - if available
      hardwareData.disk?.usage ? hardwareData.disk.usage / 100 : 0.5,
      hardwareData.disk?.readSpeed ? Math.min(hardwareData.disk.readSpeed / 500, 1) : 0.5,
      hardwareData.disk?.writeSpeed ? Math.min(hardwareData.disk.writeSpeed / 500, 1) : 0.5,
      
      // Core usage distribution (simplified)
      hardwareData.cpu.cores 
        ? Math.max(...hardwareData.cpu.cores) / 100 
        : 0.5,
      hardwareData.cpu.cores 
        ? Math.min(...hardwareData.cpu.cores) / 100 
        : 0.5,
      hardwareData.cpu.cores 
        ? this.calculateStdDev(hardwareData.cpu.cores) / 50 
        : 0.5,
    ];
    
    // Pad to expected length (16) with zeros if needed
    while (features.length < 16) {
      features.push(0);
    }
    
    return features;
  }
  
  /**
   * Calculate confidence score for predictions
   */
  private calculateConfidenceScore(hardwareData: HardwareData, gameId?: string): number {
    // In a real implementation, this would use model metrics and data quality
    // to determine a confidence score
    // For now, we'll use a simple heuristic
    
    // More complete hardware data = higher confidence
    let confidenceScore = 0.5;
    
    if (hardwareData.cpu && hardwareData.cpu.temperature !== undefined) confidenceScore += 0.1;
    if (hardwareData.gpu) confidenceScore += 0.1;
    if (hardwareData.gpu?.temperature !== undefined) confidenceScore += 0.05;
    if (hardwareData.disk) confidenceScore += 0.05;
    if (gameId) confidenceScore += 0.1;
    
    // Cap between 0.4 and 0.95
    return Math.min(Math.max(confidenceScore, 0.4), 0.95);
  }
  
  /**
   * Generate explanations for settings predictions
   */
  private generateSettingExplanations(predictions: Record<string, number>, hardwareData: HardwareData): string[] {
    const explanations: string[] = [];
    
    // Analyze CPU bottlenecks
    if (hardwareData.cpu.usage > 80) {
      explanations.push(
        "High CPU usage detected. Lowering CPU-intensive settings like physics, AI, and view distance."
      );
    }
    
    // Analyze GPU bottlenecks
    if (hardwareData.gpu?.usage && hardwareData.gpu.usage > 90) {
      explanations.push(
        "GPU is near maximum capacity. Reducing graphics quality and effects to improve performance."
      );
    }
    
    // Analyze memory constraints
    if (hardwareData.memory.usage > 85) {
      explanations.push(
        "System memory is highly utilized. Reducing texture quality to reduce memory pressure."
      );
    }
    
    // Analyze specific settings
    if (predictions.resolution < 0.4) {
      explanations.push(
        "Lower resolution recommended for better performance on your hardware."
      );
    }
    
    if (predictions.shadows < 0.3) {
      explanations.push(
        "Reduced shadow quality recommended to improve performance."
      );
    }
    
    return explanations;
  }
  
  /**
   * Generate explanations for bottleneck predictions
   */
  private generateBottleneckExplanations(predictions: Record<string, number>, hardwareData: HardwareData): string[] {
    const explanations: string[] = [];
    
    // Identify the primary bottleneck
    const bottlenecks = Object.entries(predictions).sort((a, b) => b[1] - a[1]);
    const primaryBottleneck = bottlenecks[0];
    
    if (primaryBottleneck[1] > 0.7) {
      switch (primaryBottleneck[0]) {
        case "cpu":
          explanations.push(
            "CPU is the main performance bottleneck. Consider reducing physics, AI complexity, and view distances."
          );
          
          if (hardwareData.cpu.usage > 90) {
            explanations.push(
              "CPU usage is extremely high. Check for background processes that might be consuming resources."
            );
          }
          break;
          
        case "gpu":
          explanations.push(
            "GPU is the main performance bottleneck. Consider lowering resolution, shadows, and effects."
          );
          
          if (hardwareData.gpu?.memoryUsed && hardwareData.gpu.memoryTotal && 
              (hardwareData.gpu.memoryUsed / hardwareData.gpu.memoryTotal > 0.9)) {
            explanations.push(
              "GPU memory is nearly saturated. Reducing texture quality could help improve performance."
            );
          }
          break;
          
        case "memory":
          explanations.push(
            "System memory is the main bottleneck. Consider closing background applications and reducing texture quality."
          );
          break;
          
        case "disk":
          explanations.push(
            "Storage performance is limiting game performance. Consider moving the game to an SSD if it's currently on an HDD."
          );
          break;
      }
    } else if (bottlenecks[0][1] > 0.5 && bottlenecks[1][1] > 0.4) {
      // Multiple significant bottlenecks
      explanations.push(
        `Multiple bottlenecks detected: ${bottlenecks[0][0]} (${Math.round(bottlenecks[0][1]*100)}%) and ${bottlenecks[1][0]} (${Math.round(bottlenecks[1][1]*100)}%). Consider a balanced optimization approach.`
      );
    } else {
      explanations.push(
        "No significant bottlenecks detected. Your system appears well-balanced for gaming."
      );
    }
    
    return explanations;
  }
  
  /**
   * Calculate standard deviation for a numeric array
   */
  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;
    
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }
  
  /**
   * Clear prediction cache
   */
  public clearCache(): void {
    this.cachedPredictions.clear();
    console.log("Cleared neural prediction cache");
  }
}

export const neuralPredictionEngine = new NeuralPredictionEngine();
