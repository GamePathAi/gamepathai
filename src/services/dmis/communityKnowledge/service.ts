
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";
import { KnowledgeEntry, KnowledgeQueryParams, KnowledgeStats } from './types';
import { KnowledgeStorage } from './storage';
import { KnowledgeQuery } from './knowledgeQuery';
import { KnowledgeStatsService } from './knowledgeStats';
import { SyncManager } from './syncManager';

/**
 * Community Knowledge Bank
 * 
 * A service for storing, retrieving, and sharing optimization knowledge
 * across the community of users.
 */
export class CommunityKnowledgeService {
  private knowledgeEntries: Map<string, KnowledgeEntry> = new Map();
  private syncManager: SyncManager = new SyncManager();
  private userId: string;
  
  constructor() {
    // Generate or retrieve user ID
    this.userId = localStorage.getItem('userId') || uuidv4();
    localStorage.setItem('userId', this.userId);
    
    // Load any cached knowledge entries
    this.loadFromLocalStorage();
  }
  
  /**
   * Initialize the knowledge bank
   */
  public async initialize(): Promise<boolean> {
    try {
      console.log("📚 Initializing Community Knowledge Bank...");
      
      // Load knowledge entries from server
      await this.synchronizeWithServer();
      
      return true;
    } catch (error) {
      console.error("Failed to initialize community knowledge bank:", error);
      return false;
    }
  }
  
  /**
   * Load entries from local storage
   */
  private loadFromLocalStorage(): void {
    const entries = KnowledgeStorage.loadFromLocalStorage();
    entries.forEach(entry => this.knowledgeEntries.set(entry.id, entry));
  }
  
  /**
   * Save entries to local storage
   */
  private saveToLocalStorage(): void {
    const entries = Array.from(this.knowledgeEntries.values());
    KnowledgeStorage.saveToLocalStorage(entries);
  }
  
  /**
   * Synchronize knowledge with the server
   */
  public async synchronizeWithServer(): Promise<void> {
    await this.syncManager.synchronizeWithServer(this.knowledgeEntries);
    this.saveToLocalStorage();
  }
  
  /**
   * Query knowledge entries based on specified parameters
   */
  public queryKnowledge(params: KnowledgeQueryParams): KnowledgeEntry[] {
    const entries = Array.from(this.knowledgeEntries.values());
    return KnowledgeQuery.queryKnowledge(entries, params);
  }
  
  /**
   * Submit a new knowledge entry
   */
  public submitKnowledgeEntry(
    gameId: string,
    settingsConfig: Record<string, any>,
    performance: { fps: number; frameTime: number; stability: number },
    hardwareFingerprint?: string,
    tags: string[] = []
  ): string {
    // Generate a unique ID for this entry
    const entryId = uuidv4();
    
    // Create the knowledge entry
    const entry: KnowledgeEntry = {
      id: entryId,
      gameId,
      hardwareFingerprint: hardwareFingerprint || "unknown",
      settingsConfig,
      performance,
      timestamp: Date.now(),
      upvotes: 0,
      downvotes: 0,
      tags,
      verified: false
    };
    
    // Add to our collection
    this.knowledgeEntries.set(entryId, entry);
    
    // Save to local storage
    this.saveToLocalStorage();
    
    console.log(`✅ Added new knowledge entry for ${gameId} with ID: ${entryId}`);
    
    // Schedule for sync with server
    this.scheduleSync();
    
    return entryId;
  }
  
  /**
   * Vote on a knowledge entry
   */
  public voteOnEntry(entryId: string, isUpvote: boolean): boolean {
    const entry = this.knowledgeEntries.get(entryId);
    if (!entry) {
      console.error(`Knowledge entry not found: ${entryId}`);
      return false;
    }
    
    // Update vote count
    if (isUpvote) {
      entry.upvotes += 1;
    } else {
      entry.downvotes += 1;
    }
    
    // Save changes
    this.knowledgeEntries.set(entryId, entry);
    this.saveToLocalStorage();
    
    // Schedule for sync with server
    this.scheduleSync();
    
    return true;
  }
  
  /**
   * Get detailed statistics about the knowledge bank
   */
  public getKnowledgeStats(): KnowledgeStats {
    const entries = Array.from(this.knowledgeEntries.values());
    return KnowledgeStatsService.getKnowledgeStats(entries);
  }
  
  /**
   * Schedule a sync with the server
   */
  private scheduleSync(): void {
    // In a real implementation, this would schedule a sync with a debounce
    // For now, we'll just do an immediate sync
    setTimeout(() => {
      this.synchronizeWithServer().catch(console.error);
    }, 1000);
  }
}

export const communityKnowledgeService = new CommunityKnowledgeService();
