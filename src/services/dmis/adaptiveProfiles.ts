
import { HardwareData } from "@/types/metrics";
import { communityKnowledgeService, KnowledgeEntry } from "./communityKnowledge";
import { neuralPredictionEngine } from "./neuralPrediction";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

export interface AdaptiveProfile {
  id: string;
  name: string;
  gameId: string;
  hardwareFingerprint: string;
  baseSettings: Record<string, any>;
  adaptiveOverrides: Record<string, {
    condition: {
      metric: string;
      operator: '>' | '<' | '>=' | '<=' | '=';
      value: number;
    };
    setting: string;
    value: number;
  }>[];
  performance: {
    baseFps: number;
    targetFps: number;
    minFps: number;
  };
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  autoAdjust: boolean;
  knowledgeSources: string[];
}

/**
 * Adaptive Profiles Service
 * 
 * Creates and manages adaptive game profiles that automatically adjust
 * based on real-time hardware performance and gameplay conditions.
 */
class AdaptiveProfilesService {
  private profiles: Map<string, AdaptiveProfile> = new Map();
  private activeProfiles: Map<string, string> = new Map(); // gameId -> profileId
  private localStorageKey = 'dmis_adaptive_profiles';
  
  constructor() {
    this.loadFromLocalStorage();
  }
  
  /**
   * Initialize the adaptive profiles service
   */
  public async initialize(): Promise<boolean> {
    try {
      console.log("🎮 Initializing Adaptive Profiles Service...");
      
      // If we have no profiles yet, try to generate some based on
      // community knowledge and hardware
      if (this.profiles.size === 0) {
        await this.generateInitialProfiles();
      }
      
      return true;
    } catch (error) {
      console.error("Failed to initialize adaptive profiles:", error);
      return false;
    }
  }
  
  /**
   * Load profiles from local storage
   */
  private loadFromLocalStorage(): void {
    try {
      const storedProfiles = localStorage.getItem(this.localStorageKey);
      if (storedProfiles) {
        const profileData = JSON.parse(storedProfiles) as {
          profiles: AdaptiveProfile[];
          activeProfiles: Record<string, string>;
        };
        
        profileData.profiles.forEach(profile => {
          this.profiles.set(profile.id, profile);
        });
        
        // Load active profiles
        Object.entries(profileData.activeProfiles).forEach(([gameId, profileId]) => {
          this.activeProfiles.set(gameId, profileId);
        });
        
        console.log(`📋 Loaded ${profileData.profiles.length} adaptive profiles from storage`);
      }
    } catch (error) {
      console.error("Failed to load adaptive profiles from storage:", error);
    }
  }
  
  /**
   * Save profiles to local storage
   */
  private saveToLocalStorage(): void {
    try {
      const profiles = Array.from(this.profiles.values());
      const activeProfilesObj: Record<string, string> = {};
      
      this.activeProfiles.forEach((profileId, gameId) => {
        activeProfilesObj[gameId] = profileId;
      });
      
      const profileData = {
        profiles,
        activeProfiles: activeProfilesObj
      };
      
      localStorage.setItem(this.localStorageKey, JSON.stringify(profileData));
    } catch (error) {
      console.error("Failed to save adaptive profiles to storage:", error);
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
          await this.createProfileFromKnowledge(gameId, knowledgeEntries);
        }
      }
      
      console.log(`✅ Generated ${this.profiles.size} initial adaptive profiles`);
    } catch (error) {
      console.error("Failed to generate initial profiles:", error);
    }
  }
  
  /**
   * Create a profile from knowledge entries
   */
  private async createProfileFromKnowledge(
    gameId: string, 
    knowledgeEntries: KnowledgeEntry[]
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
      const adaptiveOverrides: AdaptiveProfile['adaptiveOverrides'] = [
        {
          condition: { metric: "cpu.usage", operator: ">", value: 90 },
          setting: "view_distance",
          value: Math.max(0.3, (bestEntry.settingsConfig.view_distance || 0.5) - 0.2)
        },
        {
          condition: { metric: "gpu.usage", operator: ">", value: 95 },
          setting: "effects",
          value: Math.max(0.2, (bestEntry.settingsConfig.effects || 0.5) - 0.3)
        },
        {
          condition: { metric: "memory.usage", operator: ">", value: 85 },
          setting: "textures",
          value: Math.max(0.3, (bestEntry.settingsConfig.textures || 0.6) - 0.2)
        }
      ];
      
      // Create the profile
      const profile: AdaptiveProfile = {
        id: uuidv4(),
        name: `${this.getGameDisplayName(gameId)} - Optimized`,
        gameId,
        hardwareFingerprint: bestEntry.hardwareFingerprint,
        baseSettings: { ...bestEntry.settingsConfig },
        adaptiveOverrides,
        performance: {
          baseFps: avgFps,
          targetFps: Math.round(avgFps * 1.1), // Target 10% improvement
          minFps: Math.max(30, Math.round(avgFps * 0.8)) // Minimum 80% of average
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: false,
        autoAdjust: true,
        knowledgeSources: knowledgeEntries.map(entry => entry.id)
      };
      
      // Add the profile
      this.profiles.set(profile.id, profile);
      this.saveToLocalStorage();
      
      console.log(`✅ Created adaptive profile for ${gameId}: ${profile.name}`);
      return profile.id;
    } catch (error) {
      console.error(`Failed to create profile from knowledge for ${gameId}:`, error);
      return null;
    }
  }
  
  /**
   * Get all profiles for a specific game
   */
  public getGameProfiles(gameId: string): AdaptiveProfile[] {
    return Array.from(this.profiles.values())
      .filter(profile => profile.gameId === gameId)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
  
  /**
   * Get all available profiles
   */
  public getAllProfiles(): AdaptiveProfile[] {
    return Array.from(this.profiles.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
  
  /**
   * Get active profile for a game
   */
  public getActiveProfile(gameId: string): AdaptiveProfile | null {
    const activeProfileId = this.activeProfiles.get(gameId);
    if (!activeProfileId) return null;
    
    return this.profiles.get(activeProfileId) || null;
  }
  
  /**
   * Activate a profile for a game
   */
  public activateProfile(profileId: string): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      console.error(`Profile not found: ${profileId}`);
      return false;
    }
    
    // Set as active for this game
    this.activeProfiles.set(profile.gameId, profileId);
    
    // Update profile
    profile.isActive = true;
    profile.updatedAt = Date.now();
    
    // Deactivate all other profiles for this game
    for (const [otherProfileId, otherProfile] of this.profiles.entries()) {
      if (otherProfileId !== profileId && otherProfile.gameId === profile.gameId && otherProfile.isActive) {
        otherProfile.isActive = false;
      }
    }
    
    this.saveToLocalStorage();
    
    toast.success(`Activated profile: ${profile.name}`, {
      description: "Settings will be applied next time you launch the game"
    });
    
    console.log(`🎮 Activated profile ${profileId} for game ${profile.gameId}`);
    return true;
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
  ): string {
    const profileId = uuidv4();
    
    const profile: AdaptiveProfile = {
      id: profileId,
      name,
      gameId,
      hardwareFingerprint,
      baseSettings,
      adaptiveOverrides: [],
      performance: {
        baseFps: performance.baseFps,
        targetFps: performance.targetFps || Math.max(60, performance.baseFps),
        minFps: performance.minFps || Math.max(30, Math.floor(performance.baseFps * 0.7))
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: false,
      autoAdjust: true,
      knowledgeSources: []
    };
    
    // Add the profile
    this.profiles.set(profileId, profile);
    this.saveToLocalStorage();
    
    console.log(`✅ Created new profile ${profileId} for game ${gameId}`);
    return profileId;
  }
  
  /**
   * Update an existing profile
   */
  public updateProfile(
    profileId: string,
    updates: Partial<Omit<AdaptiveProfile, 'id' | 'createdAt' | 'gameId'>>
  ): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      console.error(`Profile not found: ${profileId}`);
      return false;
    }
    
    // Apply updates
    Object.assign(profile, {
      ...updates,
      updatedAt: Date.now()
    });
    
    // Save changes
    this.profiles.set(profileId, profile);
    this.saveToLocalStorage();
    
    console.log(`✅ Updated profile ${profileId}`);
    return true;
  }
  
  /**
   * Delete a profile
   */
  public deleteProfile(profileId: string): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      console.error(`Profile not found: ${profileId}`);
      return false;
    }
    
    // Check if this is the active profile
    if (this.activeProfiles.get(profile.gameId) === profileId) {
      this.activeProfiles.delete(profile.gameId);
    }
    
    // Remove the profile
    this.profiles.delete(profileId);
    this.saveToLocalStorage();
    
    console.log(`🗑️ Deleted profile ${profileId}`);
    return true;
  }
  
  /**
   * Apply adaptive settings based on current hardware metrics
   */
  public applyAdaptiveSettings(
    gameId: string,
    hardwareData: HardwareData
  ): Record<string, any> | null {
    const activeProfile = this.getActiveProfile(gameId);
    if (!activeProfile || !activeProfile.autoAdjust) {
      return null;
    }
    
    // Start with base settings
    const adaptedSettings = { ...activeProfile.baseSettings };
    
    // Apply adaptive overrides based on hardware metrics
    for (const override of activeProfile.adaptiveOverrides) {
      const { condition, setting, value } = override;
      
      // Extract the actual metric value using the path
      const metricPath = condition.metric.split('.');
      let metricValue: any = hardwareData;
      
      for (const path of metricPath) {
        if (metricValue && metricValue[path] !== undefined) {
          metricValue = metricValue[path];
        } else {
          // Path doesn't exist, skip this override
          metricValue = null;
          break;
        }
      }
      
      if (metricValue === null) continue;
      
      // Apply the condition
      let conditionMet = false;
      switch (condition.operator) {
        case '>': conditionMet = metricValue > condition.value; break;
        case '<': conditionMet = metricValue < condition.value; break;
        case '>=': conditionMet = metricValue >= condition.value; break;
        case '<=': conditionMet = metricValue <= condition.value; break;
        case '=': conditionMet = metricValue === condition.value; break;
      }
      
      if (conditionMet) {
        adaptedSettings[setting] = value;
      }
    }
    
    return adaptedSettings;
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
      const profileName = `${this.getGameDisplayName(gameId)} - AI Optimized`;
      
      // Create the profile
      const profileId = this.createProfile(
        gameId,
        profileName,
        blendedSettings,
        this.generateHardwareFingerprint(hardwareData),
        {
          baseFps: knowledgeEntries.length > 0 
            ? knowledgeEntries[0].performance.fps 
            : 60
        }
      );
      
      console.log(`✅ Generated optimized profile ${profileId} for ${gameId}`);
      
      // Add adaptive overrides
      const profile = this.profiles.get(profileId);
      if (profile) {
        this.updateProfile(profileId, {
          adaptiveOverrides: [
            {
              condition: { metric: "cpu.usage", operator: ">", value: 90 },
              setting: "view_distance",
              value: Math.max(0.3, blendedSettings.view_distance - 0.2)
            },
            {
              condition: { metric: "gpu.usage", operator: ">", value: 95 },
              setting: "effects",
              value: Math.max(0.2, blendedSettings.effects - 0.3)
            }
          ]
        });
      }
      
      // Add knowledge sources
      if (knowledgeEntries.length > 0) {
        this.updateProfile(profileId, {
          knowledgeSources: knowledgeEntries.map(entry => entry.id)
        });
      }
      
      toast.success(`Created optimized profile: ${profileName}`, {
        description: "AI-generated settings based on your hardware and community data"
      });
      
      return profileId;
    } catch (error) {
      console.error(`Failed to generate optimized profile for ${gameId}:`, error);
      toast.error("Failed to generate optimized profile", {
        description: "Could not create an AI-optimized profile at this time"
      });
      return null;
    }
  }
  
  /**
   * Helper to get a display name for a game
   */
  private getGameDisplayName(gameId: string): string {
    // This would ideally look up a proper game name from a game service
    // For now, just convert the ID to a nicer format
    const gameNames: Record<string, string> = {
      "cyberpunk2077": "Cyberpunk 2077",
      "valorant": "Valorant",
      "fortnite": "Fortnite",
      "csgo2": "CS2",
      "gta5": "Grand Theft Auto V"
    };
    
    return gameNames[gameId] || gameId.charAt(0).toUpperCase() + gameId.slice(1);
  }
  
  /**
   * Generate a hardware fingerprint from hardware data
   */
  private generateHardwareFingerprint(hardwareData: HardwareData): string {
    // In a real implementation, this would extract GPU model, CPU model, etc.
    // For now, we'll use a simplified version
    return `cpu-${Math.round(hardwareData.cpu.usage)}-gpu-${hardwareData.gpu?.usage || 0}-mem-${hardwareData.memory.total}`;
  }
}

export const adaptiveProfilesService = new AdaptiveProfilesService();
