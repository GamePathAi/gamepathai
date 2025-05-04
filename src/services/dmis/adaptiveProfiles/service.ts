
import { HardwareData } from "@/types/metrics";
import { toast } from "sonner";
import { communityKnowledgeService } from "../communityKnowledge";
import { profileManager } from "./profileManager";
import { profileGenerator } from "./profileGenerator";
import { settingsAdapter } from "./settingsAdapter";
import { generateHardwareFingerprint } from "./utils";

/**
 * Adaptive Profiles Service
 * 
 * Creates and manages adaptive game profiles that automatically adjust
 * based on real-time hardware performance and gameplay conditions.
 */
class AdaptiveProfilesService {
  /**
   * Initialize the adaptive profiles service
   */
  public async initialize(): Promise<boolean> {
    try {
      console.log("🎮 Initializing Adaptive Profiles Service...");
      
      // If we have no profiles yet, try to generate some based on
      // community knowledge and hardware
      if (profileManager.getAllProfiles().length === 0) {
        await this.generateInitialProfiles();
      }
      
      return true;
    } catch (error) {
      console.error("Failed to initialize adaptive profiles:", error);
      return false;
    }
  }
  
  /**
   * Generate initial profiles based on community knowledge and hardware
   */
  private async generateInitialProfiles(): Promise<void> {
    try {
      console.log("🔍 Generating initial adaptive profiles...");
      
      // Get games with available knowledge
      const knowledgeStats = communityKnowledgeService.getKnowledgeStats();
      const gameIds = Object.keys(knowledgeStats.entriesByGame);
      
      // Generate a profile for each game with knowledge entries
      for (const gameId of gameIds) {
        // Query the most relevant knowledge for this game
        const knowledgeEntries = communityKnowledgeService.queryKnowledge({
          gameId,
          sortBy: 'performance',
          limit: 5
        });
        
        if (knowledgeEntries.length > 0) {
          // Create an adaptive profile based on these entries
          await profileGenerator.createProfileFromKnowledge(gameId, knowledgeEntries);
        }
      }
      
      console.log(`✅ Generated initial adaptive profiles`);
    } catch (error) {
      console.error("Failed to generate initial profiles:", error);
    }
  }
  
  /**
   * Get all profiles for a specific game
   */
  public getGameProfiles(gameId: string) {
    return profileManager.getGameProfiles(gameId);
  }
  
  /**
   * Get all available profiles
   */
  public getAllProfiles() {
    return profileManager.getAllProfiles();
  }
  
  /**
   * Get active profile for a game
   */
  public getActiveProfile(gameId: string) {
    return profileManager.getActiveProfile(gameId);
  }
  
  /**
   * Activate a profile for a game
   */
  public activateProfile(profileId: string) {
    return profileManager.activateProfile(profileId);
  }
  
  /**
   * Create a new adaptive profile
   */
  public createProfile(
    gameId: string,
    name: string,
    baseSettings: Record<string, any>,
    hardwareFingerprint: string,
    performance: { baseFps: number; targetFps?: number; minFps?: number } = { baseFps: 60 }
  ) {
    return profileManager.createProfile(gameId, name, baseSettings, hardwareFingerprint, performance);
  }
  
  /**
   * Update an existing profile
   */
  public updateProfile(
    profileId: string,
    updates: any
  ) {
    return profileManager.updateProfile(profileId, updates);
  }
  
  /**
   * Delete a profile
   */
  public deleteProfile(profileId: string) {
    return profileManager.deleteProfile(profileId);
  }
  
  /**
   * Apply adaptive settings based on current hardware metrics
   */
  public applyAdaptiveSettings(
    gameId: string,
    hardwareData: HardwareData
  ): Record<string, any> | null {
    const activeProfile = this.getActiveProfile(gameId);
    if (!activeProfile) return null;
    
    return settingsAdapter.applyAdaptiveSettings(activeProfile, hardwareData);
  }
  
  /**
   * Generate an optimized profile using both community knowledge and ML predictions
   */
  public async generateOptimizedProfile(
    gameId: string,
    hardwareData: HardwareData,
    currentSettings?: Record<string, any>
  ): Promise<string | null> {
    return profileGenerator.generateOptimizedProfile(gameId, hardwareData, currentSettings);
  }
}

export const adaptiveProfilesService = new AdaptiveProfilesService();
