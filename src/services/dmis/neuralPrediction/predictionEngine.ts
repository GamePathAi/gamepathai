
import { HardwareData } from "@/types/metrics";
import { federatedLearningService } from "../federatedLearning";
import { PredictionConfig, PredictionResult } from "./types";
import { modelManager } from "./modelManager";
import { 
  prepareGameSettingsFeatures, 
  prepareBottleneckFeatures 
} from "./featureExtraction";
import { 
  generateSettingExplanations,
  generateBottleneckExplanations,
  calculateConfidenceScore 
} from "./utils";

/**
 * Multi-Dimensional Neural Prediction Engine
 * 
 * A service for making predictions about optimal game settings, hardware bottlenecks,
 * and performance improvements based on hardware metrics and user preferences.
 */
class NeuralPredictionEngine {
  private cachedPredictions: Map<string, PredictionResult> = new Map();
  
  /**
   * Clear prediction cache
   */
  public clearCache(): void {
    this.cachedPredictions.clear();
    console.log("Cleared neural prediction cache");
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
      const features = prepareGameSettingsFeatures(hardwareData, currentSettings);
      
      // Get the model ID for game optimization
      const modelId = modelManager.getModelForDimension("performance");
      
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
        ? generateSettingExplanations(predictions, hardwareData)
        : undefined;
      
      // Calculate confidence score
      const confidence = config.confidence || calculateConfidenceScore(hardwareData, gameId);
      
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
      const features = prepareBottleneckFeatures(hardwareData);
      
      // Get the model ID for bottleneck detection
      const modelId = modelManager.getModelForDimension("bottlenecks");
      
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
        ? generateBottleneckExplanations(predictions, hardwareData)
        : undefined;
      
      // Calculate confidence score
      const confidence = config.confidence || calculateConfidenceScore(hardwareData, gameId);
      
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
}

export const predictionEngine = new NeuralPredictionEngine();
