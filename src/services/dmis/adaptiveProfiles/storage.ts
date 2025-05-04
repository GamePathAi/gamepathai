
import { AdaptiveProfile } from './types';

/**
 * Storage handling for adaptive profiles
 */
export class AdaptiveProfilesStorage {
  private localStorageKey = 'dmis_adaptive_profiles';
  
  /**
   * Load profiles from local storage
   */
  public loadFromLocalStorage(): {
    profiles: AdaptiveProfile[];
    activeProfiles: Record<string, string>;
  } {
    try {
      const storedProfiles = localStorage.getItem(this.localStorageKey);
      if (storedProfiles) {
        const profileData = JSON.parse(storedProfiles) as {
          profiles: AdaptiveProfile[];
          activeProfiles: Record<string, string>;
        };
        
        console.log(`📋 Loaded ${profileData.profiles.length} adaptive profiles from storage`);
        return profileData;
      }
    } catch (error) {
      console.error("Failed to load adaptive profiles from storage:", error);
    }
    
    return { profiles: [], activeProfiles: {} };
  }
  
  /**
   * Save profiles to local storage
   */
  public saveToLocalStorage(
    profiles: AdaptiveProfile[],
    activeProfilesMap: Map<string, string>
  ): void {
    try {
      const activeProfilesObj: Record<string, string> = {};
      
      activeProfilesMap.forEach((profileId, gameId) => {
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
}

export const profilesStorage = new AdaptiveProfilesStorage();
