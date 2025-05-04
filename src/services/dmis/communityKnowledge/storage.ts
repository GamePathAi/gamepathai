
import { KnowledgeEntry } from './types';

const LOCAL_STORAGE_KEY = 'dmis_community_knowledge';

/**
 * Handles local storage operations for knowledge entries
 */
export class KnowledgeStorage {
  /**
   * Load entries from local storage
   */
  public static loadFromLocalStorage(): KnowledgeEntry[] {
    try {
      const storedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedData) {
        const entries = JSON.parse(storedData) as KnowledgeEntry[];
        console.log(`📋 Loaded ${entries.length} knowledge entries from local storage`);
        return entries;
      }
    } catch (error) {
      console.error("Failed to load knowledge entries from local storage:", error);
      // If there's an error in the stored data, clear it
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
    
    return [];
  }
  
  /**
   * Save entries to local storage
   */
  public static saveToLocalStorage(entries: KnowledgeEntry[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error("Failed to save knowledge entries to local storage:", error);
    }
  }
}
