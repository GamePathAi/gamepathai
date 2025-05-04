
import { useCallback } from 'react';
import { toast } from "sonner";
import { HardwareData } from '@/types/metrics';
import { neuralPredictionEngine } from '@/services/dmis/neuralPrediction';
import { communityKnowledgeService } from '@/services/dmis/communityKnowledge';
import { adaptiveProfilesService } from '@/services/dmis/adaptiveProfiles';
import { DMISStatus } from '../useDMISStatus';

interface UseOptimizationActionsProps {
  status: DMISStatus;
}

export function useOptimizationActions({ status }: UseOptimizationActionsProps) {
  /**
   * Generate optimized settings for a game
   */
  const generateOptimizedSettings = useCallback(async (
    gameId: string,
    hardwareData: HardwareData,
    currentSettings?: Record<string, any>
  ) => {
    if (!status.initialized) {
      throw new Error("DMIS not initialized");
    }
    
    try {
      console.log(`🎮 Generating optimized settings for game: ${gameId}`);
      
      // Check if we have an adaptive profile for this game
      const activeProfile = adaptiveProfilesService.getActiveProfile(gameId);
      
      if (activeProfile) {
        // Use the adaptive profile to generate settings
        console.log(`📊 Using adaptive profile: ${activeProfile.name}`);
        const adaptedSettings = adaptiveProfilesService.applyAdaptiveSettings(gameId, hardwareData);
        
        if (adaptedSettings) {
          return {
            settings: adaptedSettings,
            source: "adaptive_profile",
            confidence: 0.85,
            profileId: activeProfile.id
          };
        }
      }
      
      // If no adaptive profile or it failed, use neural prediction
      if (status.neuralPredictionReady) {
        console.log("🧠 Using neural prediction engine");
        const prediction = await neuralPredictionEngine.predictOptimalSettings(
          gameId,
          hardwareData, 
          currentSettings || {}
        );
        
        return {
          settings: prediction.predictions,
          source: "neural_prediction",
          confidence: prediction.confidence,
          explanations: prediction.explanations
        };
      }
      
      // If neural prediction isn't available, use community knowledge
      if (status.communityKnowledgeReady) {
        console.log("📚 Using community knowledge");
        const knowledgeEntries = communityKnowledgeService.queryKnowledge({
          gameId,
          sortBy: "performance",
          limit: 1
        });
        
        if (knowledgeEntries.length > 0) {
          return {
            settings: knowledgeEntries[0].settingsConfig,
            source: "community_knowledge",
            confidence: 0.7,
            knowledgeId: knowledgeEntries[0].id
          };
        }
      }
      
      // Fallback to default settings
      console.log("⚠️ No optimization source available, using defaults");
      return {
        settings: {
          resolution: 0.5,      // 1080p
          graphics_quality: 0.5, // Medium
          antialiasing: 0.5,     // Medium
          shadows: 0.5,          // Medium
          textures: 0.5,         // Medium
          effects: 0.5,          // Medium
          view_distance: 0.5,    // Medium
          fps_cap: 0.6          // 60fps
        },
        source: "default",
        confidence: 0.5
      };
    } catch (error) {
      console.error("Error generating optimized settings:", error);
      throw error;
    }
  }, [status]);

  /**
   * Generate an optimized game profile
   */
  const generateOptimizedProfile = useCallback(async (
    gameId: string,
    hardwareData: HardwareData,
    currentSettings?: Record<string, any>
  ) => {
    if (!status.initialized) {
      throw new Error("DMIS not initialized");
    }
    
    if (!status.adaptiveProfilesReady) {
      throw new Error("Adaptive profiles not ready");
    }
    
    try {
      console.log("🎮 Generating optimized game profile");
      
      const profileId = await adaptiveProfilesService.generateOptimizedProfile(
        gameId,
        hardwareData,
        currentSettings
      );
      
      if (!profileId) {
        throw new Error("Failed to generate optimized profile");
      }
      
      // Activate the profile
      adaptiveProfilesService.activateProfile(profileId);
      
      // Get the profile
      const profile = adaptiveProfilesService.getAllProfiles()
        .find(p => p.id === profileId);
      
      return { profileId, profile };
    } catch (error) {
      console.error("Error generating optimized profile:", error);
      throw error;
    }
  }, [status]);

  return {
    generateOptimizedSettings,
    generateOptimizedProfile
  };
}
