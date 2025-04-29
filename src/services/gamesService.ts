
import { apiClient } from "./api";
import { mlService } from "./mlApiClient";
import { Game } from "@/hooks/useGames";

export const gamesService = {
  getGames: async () => {
    try {
      console.log("🎮 Buscando lista de jogos via API padrão");
      // First try standard API
      return await apiClient.fetch<Game[]>("/api/games");
    } catch (error) {
      console.log("⚠️ Standard API failed for games, trying ML service as fallback");
      
      try {
        // Fall back to ML service for game detection
        console.log("🧠 Tentando detecção ML como fallback");
        const mlDetectedGames = await mlService.detectGames();
        
        if (mlDetectedGames?.detectedGames?.length > 0) {
          console.log(`✅ ML detectou ${mlDetectedGames.detectedGames.length} jogos`);
          // Transform the ML detected games to match our Game interface
          return mlDetectedGames.detectedGames.map(game => ({
            id: game.id,
            name: game.name,
            image: `https://placehold.co/600x400/1A2033/ffffff?text=${encodeURIComponent(game.name)}`,
            isOptimized: false,
            genre: "Detected",
            optimizationType: "none"
          }));
        } else {
          console.log("⚠️ ML não detectou jogos");
        }
      } catch (mlError) {
        console.error("❌ Both API and ML service failed for games:", mlError);
        
        // MELHORADO: Log mais detalhado para erros de ML
        if (mlError?.message?.includes('redirect')) {
          console.error("🚨 Detected redirect in ML game detection - this should be blocked!");
        }
      }
      
      // Gerar alguns jogos mockados para desenvolvimento
      console.log("⚠️ Usando dados mockados para jogos");
      return [
        {
          id: "apex-legends",
          name: "Apex Legends",
          image: "https://placehold.co/600x400/1A2033/ffffff?text=Apex%20Legends",
          isOptimized: false,
          genre: "Battle Royale",
          optimizationType: "none"
        },
        {
          id: "cs2",
          name: "Counter-Strike 2",
          image: "https://placehold.co/600x400/1A2033/ffffff?text=Counter-Strike%202",
          isOptimized: false,
          genre: "FPS",
          optimizationType: "none"
        },
        {
          id: "valorant",
          name: "Valorant",
          image: "https://placehold.co/600x400/1A2033/ffffff?text=Valorant",
          isOptimized: false,
          genre: "FPS Tático",
          optimizationType: "none"
        },
        // NOVO: Mais jogos mockados para melhor visualização
        {
          id: "fortnite",
          name: "Fortnite",
          image: "https://placehold.co/600x400/1A2033/ffffff?text=Fortnite",
          isOptimized: false,
          genre: "Battle Royale",
          optimizationType: "none"
        },
        {
          id: "league-of-legends",
          name: "League of Legends",
          image: "https://placehold.co/600x400/1A2033/ffffff?text=League%20of%20Legends",
          isOptimized: false,
          genre: "MOBA",
          optimizationType: "none"
        }
      ];
    }
  },
    
  getGameDetails: (gameId: string) => 
    apiClient.fetch(`/api/games/${gameId}`),
    
  optimizeGame: async (gameId: string) => {
    try {
      console.log(`🧠 Tentando otimizar jogo ${gameId} via serviço ML`);
      // MELHORADO: Usar diretamente o serviço ML com opções avançadas
      return await mlService.optimizeGame(gameId, {
        optimizeRoutes: true,
        optimizeSettings: true,
        optimizeSystem: true,
        aggressiveness: 'medium'
      });
    } catch (mlError) {
      console.log("⚠️ ML service failed for game optimization, falling back to standard API");
      
      // Log detalhado para diagnosticar problemas
      if (mlError?.message?.includes('redirect')) {
        console.error("🚨 Detected redirect in ML optimization - this should be blocked!");
      }
      
      try {
        console.log(`🔄 Tentando API padrão para otimização de ${gameId}`);
        // Fall back to standard API
        return await apiClient.fetch(`/api/games/${gameId}/optimize`, {
          method: "POST"
        });
      } catch (apiError) {
        console.error("❌ Ambas as tentativas de otimização falharam:", apiError);
        
        // Para fins de desenvolvimento, retornar uma resposta simulada
        console.log("⚠️ Retornando resposta simulada de otimização");
        return {
          success: true,
          optimizationType: "both",
          improvements: {
            latency: 25,
            fps: 15,
            stability: 30
          }
        };
      }
    }
  }
};
