
import { KnowledgeEntry, KnowledgeStats } from './types';

/**
 * Provides statistics and analytics about knowledge entries
 */
export class KnowledgeStatsService {
  /**
   * Get detailed statistics about the knowledge bank
   */
  public static getKnowledgeStats(entries: KnowledgeEntry[]): KnowledgeStats {
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
}
