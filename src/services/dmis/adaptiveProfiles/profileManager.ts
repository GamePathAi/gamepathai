
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { AdaptiveProfile } from './types';
import { profilesStorage } from './storage';
import { getGameDisplayName } from './utils';

/**
 * Handles profile management operations
 */
export class ProfileManager {
  private profiles: Map<string, AdaptiveProfile> = new Map();
  private activeProfiles: Map<string, string> = new Map(); // gameId -> profileId
  
  constructor() {
    this.loadProfiles();
  }
  
  /**
   * Load profiles from storage
   */
  private loadProfiles(): void {
    const { profiles, activeProfiles } = profilesStorage.loadFromLocalStorage();
    
    // Load profiles
    profiles.forEach(profile => {
      this.profiles.set(profile.id, profile);
    });
    
    // Load active profiles
    Object.entries(activeProfiles).forEach(([gameId, profileId]) => {
      this.activeProfiles.set(gameId, profileId);
    });
  }
  
  /**
   * Save profiles to storage
   */
  private saveProfiles(): void {
    profilesStorage.saveToLocalStorage(
      Array.from(this.profiles.values()),
      this.activeProfiles
    );
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
    
    this.saveProfiles();
    
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
    this.saveProfiles();
    
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
    this.saveProfiles();
    
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
    this.saveProfiles();
    
    console.log(`🗑️ Deleted profile ${profileId}`);
    return true;
  }
}

export const profileManager = new ProfileManager();
