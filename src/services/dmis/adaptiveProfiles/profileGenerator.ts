
import { toast } from "sonner";
import { HardwareData } from "@/types/metrics";
import { communityKnowledgeService } from "../communityKnowledge";
import { neuralPredictionEngine } from "../neuralPrediction";
import { AdaptiveProfile, AdaptiveOverride } from "./types";
import { getGameDisplayName, generateHardwareFingerprint } from "./utils";
import { profileManager } from "./profileManager";

/**
 * Handles generating and optimizing profiles from various sources
 */
export class ProfileGenerator {
  /**
   * Create a profile from knowledge entries
   */
  public async createProfileFromKnowledge(
    gameId: string, 
    knowledgeEntries: any[]
  ): Promise<string | null> {
    if (knowledgeEntries.length === 0) {
      console.error("No knowledge entries provided for profile creation");
      return null;
    }
    
    try {
      // Calculate average performance metrics
      let totalFps = 0;
      let totalFrameTime = 0;
      
      // Extract base settings from the best performing entry
      const bestEntry = knowledgeEntries.sort(
        (a, b) => b.performance.fps - a.performance.fps
      )[0];
      
      // Calculate averages
      knowledgeEntries.forEach(entry => {
        totalFps += entry.performance.fps;
        totalFrameTime += entry.performance.frameTime;
      });
      
      const avgFps = totalFps / knowledgeEntries.length;
      const avgFrameTime = totalFrameTime / knowledgeEntries.length;
      
      // Generate adaptive overrides based on patterns in knowledge
      const adaptiveOverrides: AdaptiveOverride[] = [
        {
          condition: {
            metric: "cpu.usage",
            operator: ">",
            value: 90
          },
          setting: "view_distance",
          value: Math.max(0.3, (bestEntry.settingsConfig.view_distance || 0.5) - 0.2)
        },
        {
          condition: {
            metric: "gpu.usage",
            operator: ">",
            value: 95
          },
          setting: "effects",
          value: Math.max(0.2, (bestEntry.settingsConfig.effects || 0.5) - 0.3)
        },
        {
          condition: {
            metric: "memory.usage",
            operator: ">",
            value: 85
          },
          setting: "textures",
          value: Math.max(0.3, (bestEntry.settingsConfig.textures || 0.6) - 0.2)
        }
      ];
      
      // Create the profile
      const profileId = profileManager.createProfile(
        gameId,
        `${getGameDisplayName(gameId)} - Optimized`,
        { ...bestEntry.settingsConfig },
        bestEntry.hardwareFingerprint,
        {
          baseFps: avgFps,
          targetFps: Math.round(avgFps * 1.1), // Target 10% improvement
          minFps: Math.max(30, Math.round(avgFps * 0.8)) // Minimum 80% of average
        }
      );
      
      // Update the profile with the adaptive overrides and knowledge sources
      profileManager.updateProfile(profileId, {
        adaptiveOverrides,
        knowledgeSources: knowledgeEntries.map(entry => entry.id)
      });
      
      console.log(`✅ Created adaptive profile for ${gameId} from knowledge`);
      return profileId;
    } catch (error) {
      console.error(`Failed to create profile from knowledge for ${gameId}:`, error);
      return null;
    }
  }
  
  /**
   * Generate an optimized profile using both community knowledge and ML predictions
   */
  public async generateOptimizedProfile(
    gameId: string,
    hardwareData: HardwareData,
    currentSettings?: Record<string, any>
  ): Promise<string | null> {
    try {
      console.log(`🧠 Generating optimized profile for game: ${gameId}`);
      
      // Get knowledge entries for this game
      const knowledgeEntries = communityKnowledgeService.queryKnowledge({
        gameId,
        sortBy: 'performance',
        limit: 3
      });
      
      // Get ML predictions
      const predictionResult = await neuralPredictionEngine.predictOptimalSettings(
        gameId,
        hardwareData,
        currentSettings || (knowledgeEntries[0]?.settingsConfig || {})
      );
      
      // Blend ML predictions with community knowledge
      const blendedSettings: Record<string, any> = {};
      const settingKeys = [
        "resolution", "graphics_quality", "antialiasing", 
        "shadows", "textures", "effects", "view_distance", "fps_cap"
      ];
      
      // Base weight for ML predictions (0-1)
      // Higher confidence gives ML more weight
      const mlWeight = predictionResult.confidence;
      const knowledgeWeight = 1 - mlWeight;
      
      // For each setting, blend ML with community knowledge
      for (const key of settingKeys) {
        // Start with ML prediction
        let settingValue = predictionResult.predictions[key] || 0.5;
        
        // If we have knowledge entries, blend their values
        if (knowledgeEntries.length > 0) {
          let knowledgeValue = 0;
          let totalWeight = 0;
          
          // Weight knowledge entries by their performance
          knowledgeEntries.forEach(entry => {
            if (entry.settingsConfig[key] !== undefined) {
              // Higher FPS entries get more weight
              const weight = entry.performance.fps / 100;
              knowledgeValue += entry.settingsConfig[key] * weight;
              totalWeight += weight;
            }
          });
          
          if (totalWeight > 0) {
            knowledgeValue /= totalWeight; // Normalize
            
            // Blend ML prediction with knowledge-based value
            settingValue = (settingValue * mlWeight) + (knowledgeValue * knowledgeWeight);
          }
        }
        
        blendedSettings[key] = settingValue;
      }
      
      // Generate a profile name
      const profileName = `${getGameDisplayName(gameId)} - AI Optimized`;
      
      // Create the profile
      const profileId = profileManager.createProfile(
        gameId,
        profileName,
        blendedSettings,
        generateHardwareFingerprint(hardwareData),
        {
          baseFps: knowledgeEntries.length > 0 
            ? knowledgeEntries[0].performance.fps 
            : 60
        }
      );
      
      // Add adaptive overrides
      profileManager.updateProfile(profileId, {
        adaptiveOverrides: [
          {
            condition: {
              metric: "cpu.usage",
              operator: ">",
              value: 90
            },
            setting: "view_distance",
            value: Math.max(0.3, blendedSettings.view_distance - 0.2)
          },
          {
            condition: {
              metric: "gpu.usage",
              operator: ">",
              value: 95
            },
            setting: "effects",
            value: Math.max(0.2, blendedSettings.effects - 0.3)
          }
        ]
      });
      
      // Add knowledge sources
      if (knowledgeEntries.length > 0) {
        profileManager.updateProfile(profileId, {
          knowledgeSources: knowledgeEntries.map(entry => entry.id)
        });
      }
      
      toast.success(`Created optimized profile: ${profileName}`, {
        description: "AI-generated settings based on your hardware and community data"
      });
      
      console.log(`✅ Generated optimized profile ${profileId} for ${gameId}`);
      return profileId;
    } catch (error) {
      console.error(`Failed to generate optimized profile for ${gameId}:`, error);
      toast.error("Failed to generate optimized profile", {
        description: "Could not create an AI-optimized profile at this time"
      });
      return null;
    }
  }
}

export const profileGenerator = new ProfileGenerator();
