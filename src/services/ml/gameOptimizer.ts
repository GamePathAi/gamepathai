
/**
 * ML Game Optimizer Service
 * Handles overall game optimization using ML recommendations
 */
import { mlApiClient } from './mlApiClient';
import { toast } from "sonner";
import { MLOptimizeGameResponse, MLOptimizationOptions } from './types';
import { CACHE_TTL } from './mlCacheManager'; // Updated import path

export const gameOptimizerService = {
  /**
   * Optimize a specific game using ML recommendations
   */
  optimizeGame: async (gameId: string, options: MLOptimizationOptions = {}): Promise<MLOptimizeGameResponse> => {
    // Default all options to true if not specified
    const finalOptions = {
      optimizeRoutes: true,
      optimizeSettings: true,
      optimizeSystem: true,
      aggressiveness: 'medium',
      ...options
    };
    
    console.log(`🔧 Iniciando otimização para jogo ID: ${gameId}`, {
      options: finalOptions
    });
    
    try {
      toast.loading(`Otimizando ${gameId}...`);
      
      const result = await mlApiClient.withRetry(
        `/ml/optimize-game/${gameId}`,
        {
          method: 'POST',
          body: JSON.stringify(finalOptions),
          cacheTTL: CACHE_TTL.OPTIMIZE
        }
      );
      
      const typedResult = result as MLOptimizeGameResponse;
      
      if (typedResult.success) {
        toast.success("Otimização concluída", {
          description: `Jogo ${gameId} otimizado com sucesso`
        });
      }
      
      return typedResult;
    } catch (error) {
      console.error('Game optimization failed:', error);
      toast.error("Falha na otimização do jogo", {
        description: `Não foi possível otimizar o jogo ${gameId}`
      });
      
      throw error;
    }
  }
};
