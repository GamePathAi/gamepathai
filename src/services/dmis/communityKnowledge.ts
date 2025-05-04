
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

export interface KnowledgeEntry {
  id: string;
  gameId: string;
  hardwareFingerprint: string;
  settingsConfig: Record<string, any>;
  performance: {
    fps: number;
    frameTime: number;
    stability: number;
  };
  timestamp: number;
  upvotes: number;
  downvotes: number;
  tags: string[];
  verified: boolean;
}

export interface KnowledgeQueryParams {
  gameId: string;
  hardwareSpec?: {
    cpuModel?: string;
    gpuModel?: string;
    ramAmount?: number;
    minPerformance?: number;
  };
  sortBy?: 'performance' | 'popularity' | 'recency';
  limit?: number;
}

/**
 * Community Knowledge Bank
 * 
 * A service for storing, retrieving, and sharing optimization knowledge
 * across the community of users.
 */
class CommunityKnowledgeService {
  private knowledgeEntries: Map<string, KnowledgeEntry> = new Map();
  private localStorageKey = 'dmis_community_knowledge';
  private syncInProgress = false;
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
    try {
      const storedData = localStorage.getItem(this.localStorageKey);
      if (storedData) {
        const entries = JSON.parse(storedData) as KnowledgeEntry[];
        entries.forEach(entry => this.knowledgeEntries.set(entry.id, entry));
        console.log(`📋 Loaded ${entries.length} knowledge entries from local storage`);
      }
    } catch (error) {
      console.error("Failed to load knowledge entries from local storage:", error);
      // If there's an error in the stored data, clear it
      localStorage.removeItem(this.localStorageKey);
    }
  }
  
  /**
   * Save entries to local storage
   */
  private saveToLocalStorage(): void {
    try {
      const entries = Array.from(this.knowledgeEntries.values());
      localStorage.setItem(this.localStorageKey, JSON.stringify(entries));
    } catch (error) {
      console.error("Failed to save knowledge entries to local storage:", error);
    }
  }
  
  /**
   * Synchronize knowledge with the server
   */
  public async synchronizeWithServer(): Promise<void> {
    if (this.syncInProgress) {
      console.log("Knowledge sync already in progress, skipping");
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      console.log("🔄 Synchronizing knowledge with server...");
      
      // In a real implementation, this would fetch from a server
      // and merge with local knowledge
      
      // For now, let's just simulate fetching community knowledge
      await this.fetchRemoteKnowledge();
      
      // Upload any local entries that haven't been synced
      await this.uploadLocalEntries();
      
      console.log("✅ Knowledge synchronization complete");
    } catch (error) {
      console.error("Failed to synchronize knowledge with server:", error);
      toast.error("Failed to sync optimization knowledge", {
        description: "Could not connect to the community knowledge bank"
      });
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Fetch knowledge from remote server
   */
  private async fetchRemoteKnowledge(): Promise<void> {
    // In a real implementation, this would fetch from a server
    // For now, we'll generate some mock data if our local store is empty
    
    if (this.knowledgeEntries.size > 0) {
      return; // Skip generating mock data if we already have entries
    }
    
    // Generate mock community knowledge entries
    const mockEntries: KnowledgeEntry[] = [
      {
        id: uuidv4(),
        gameId: "cyberpunk2077",
        hardwareFingerprint: "nvidia-rtx3070-ryzen5600x-32gb",
        settingsConfig: {
          resolution: 0.75, // 1440p
          graphics_quality: 0.7,
          antialiasing: 0.5,
          shadows: 0.6,
          textures: 0.8,
          effects: 0.7,
          view_distance: 0.7,
          fps_cap: 0.6 // 60fps
        },
        performance: {
          fps: 78.5,
          frameTime: 12.7,
          stability: 0.92
        },
        timestamp: Date.now() - 1000000,
        upvotes: 42,
        downvotes: 3,
        tags: ["balanced", "ray-tracing", "verified"],
        verified: true
      },
      {
        id: uuidv4(),
        gameId: "fortnite",
        hardwareFingerprint: "nvidia-gtx1660-i5-10400-16gb",
        settingsConfig: {
          resolution: 0.5, // 1080p
          graphics_quality: 0.4,
          antialiasing: 0.3,
          shadows: 0.2,
          textures: 0.5,
          effects: 0.3,
          view_distance: 0.7,
          fps_cap: 1.0 // 240fps
        },
        performance: {
          fps: 165.2,
          frameTime: 6.1,
          stability: 0.85
        },
        timestamp: Date.now() - 500000,
        upvotes: 89,
        downvotes: 7,
        tags: ["competitive", "high-fps"],
        verified: true
      },
      {
        id: uuidv4(),
        gameId: "cyberpunk2077",
        hardwareFingerprint: "nvidia-rtx2060-i7-9700k-32gb",
        settingsConfig: {
          resolution: 0.5, // 1080p
          graphics_quality: 0.5,
          antialiasing: 0.4,
          shadows: 0.3,
          textures: 0.6,
          effects: 0.4,
          view_distance: 0.5,
          fps_cap: 0.6 // 60fps
        },
        performance: {
          fps: 62.3,
          frameTime: 16.1,
          stability: 0.88
        },
        timestamp: Date.now() - 2000000,
        upvotes: 27,
        downvotes: 5,
        tags: ["balanced"],
        verified: false
      }
    ];
    
    // Add mock entries to our knowledge bank
    mockEntries.forEach(entry => this.knowledgeEntries.set(entry.id, entry));
    this.saveToLocalStorage();
    
    console.log(`📋 Added ${mockEntries.length} mock knowledge entries`);
  }
  
  /**
   * Upload local entries to the server
   */
  private async uploadLocalEntries(): Promise<void> {
    // In a real implementation, this would upload unsynced local entries to a server
    console.log("📤 Checking for knowledge entries to upload...");
    // This would normally upload entries that are marked as not synced
  }
  
  /**
   * Query knowledge entries based on specified parameters
   */
  public queryKnowledge(params: KnowledgeQueryParams): KnowledgeEntry[] {
    console.log(`🔍 Querying knowledge for game: ${params.gameId}`);
    
    // Filter entries by game ID
    let filteredEntries = Array.from(this.knowledgeEntries.values())
      .filter(entry => entry.gameId === params.gameId);
    
    // Filter by hardware spec if provided
    if (params.hardwareSpec) {
      // This would be much more sophisticated in a real implementation
      // For now, we'll do simple string matching on the hardware fingerprint
      
      if (params.hardwareSpec.gpuModel) {
        const gpuModelLower = params.hardwareSpec.gpuModel.toLowerCase();
        filteredEntries = filteredEntries.filter(entry => 
          entry.hardwareFingerprint.toLowerCase().includes(gpuModelLower)
        );
      }
      
      if (params.hardwareSpec.cpuModel) {
        const cpuModelLower = params.hardwareSpec.cpuModel.toLowerCase();
        filteredEntries = filteredEntries.filter(entry => 
          entry.hardwareFingerprint.toLowerCase().includes(cpuModelLower)
        );
      }
      
      if (params.hardwareSpec.minPerformance) {
        filteredEntries = filteredEntries.filter(entry => 
          entry.performance.fps >= (params.hardwareSpec?.minPerformance || 0)
        );
      }
    }
    
    // Sort entries based on sortBy parameter
    switch (params.sortBy) {
      case 'performance':
        filteredEntries.sort((a, b) => b.performance.fps - a.performance.fps);
        break;
        
      case 'popularity':
        filteredEntries.sort((a, b) => 
          (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)
        );
        break;
        
      case 'recency':
      default:
        filteredEntries.sort((a, b) => b.timestamp - a.timestamp);
        break;
    }
    
    // Apply limit if specified
    if (params.limit && params.limit > 0) {
      filteredEntries = filteredEntries.slice(0, params.limit);
    }
    
    return filteredEntries;
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
  public getKnowledgeStats(): {
    totalEntries: number;
    entriesByGame: Record<string, number>;
    recentEntriesCount: number;
    verifiedEntriesCount: number;
  } {
    const entries = Array.from(this.knowledgeEntries.values());
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    
    // Count entries by game
    const entriesByGame: Record<string, number> = {};
    entries.forEach(entry => {
      entriesByGame[entry.gameId] = (entriesByGame[entry.gameId] || 0) + 1;
    });
    
    return {
      totalEntries: entries.length,
      entriesByGame,
      recentEntriesCount: entries.filter(entry => entry.timestamp > oneWeekAgo).length,
      verifiedEntriesCount: entries.filter(entry => entry.verified).length
    };
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
