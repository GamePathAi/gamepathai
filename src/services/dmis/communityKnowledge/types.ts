
/**
 * Type definitions for the Community Knowledge system
 */

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

export interface KnowledgeStats {
  totalEntries: number;
  entriesByGame: Record<string, number>;
  recentEntriesCount: number;
  verifiedEntriesCount: number;
}
