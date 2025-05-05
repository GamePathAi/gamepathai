
/**
 * ML Game Detection Service
 * Detects installed games and their state
 */
import { mlApiClient } from './mlApiClient';
import { toast } from "sonner";
import { MLDetectedGamesResponse } from './types';
import { CACHE_TTL } from './mlCacheManager';

export const gameDetectionService = {
  /**
   * Detect installed games on the system
   */
  detectGames: async (): Promise<MLDetectedGamesResponse> => {
    try {
      const result = await mlApiClient.withRetry(
        '/ml/game-detection',
        { 
          method: 'GET',
          cacheTTL: CACHE_TTL.GAMES
        }
      );
      return result as MLDetectedGamesResponse;
    } catch (error) {
      console.error('Game detection failed:', error);
      toast.error("Falha na detecção de jogos", {
        description: "Não foi possível detectar os jogos instalados"
      });
      throw error;
    }
  }
};
