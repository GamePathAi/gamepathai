
import { KnowledgeEntry, KnowledgeQueryParams } from './types';

/**
 * Handles querying and filtering of knowledge entries
 */
export class KnowledgeQuery {
  /**
   * Query knowledge entries based on specified parameters
   */
  public static queryKnowledge(
    entries: KnowledgeEntry[], 
    params: KnowledgeQueryParams
  ): KnowledgeEntry[] {
    console.log(`🔍 Querying knowledge for game: ${params.gameId}`);
    
    // Filter entries by game ID
    let filteredEntries = entries.filter(entry => entry.gameId === params.gameId);
    
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
}
