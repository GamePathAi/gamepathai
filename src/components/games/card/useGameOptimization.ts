
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MLOptimizeGameResponse } from "@/services/ml";
import { useSystemInfo } from "@/hooks/useSystemInfo";

interface GameType {
  id: string;
  name: string;
  isOptimized: boolean;
  optimizationType?: "network" | "system" | "both" | "none";
}

export const useGameOptimization = (game: GameType) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const { systemInfo } = useSystemInfo();
  
  useEffect(() => {
    // Clear error state when game changes
    setOptimizationError(null);
  }, [game.id]);
  
  // Handle optimization progress simulation
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (isOptimizing) {
      interval = setInterval(() => {
        setOptimizationProgress(prev => {
          // Cap at 90% - the final jump happens when the API responds
          if (prev >= 90) {
            clearInterval(interval!);
            return 90;
          }
          return prev + 5;
        });
      }, 300);
    } else if (optimizationProgress > 0 && optimizationProgress < 100) {
      // Complete the progress bar when optimization is done
      setOptimizationProgress(100);
      
      // Reset after animation completes
      setTimeout(() => {
        setOptimizationProgress(0);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOptimizing, optimizationProgress]);
  
  const handleOptimize = async () => {
    if (isOptimizing) return;
    
    setOptimizationError(null);
    setIsOptimizing(true);
    setOptimizationProgress(10);
    
    const toastId = toast.loading(`Otimizando ${game.name}...`, {
      description: "Aplicando inteligência artificial ao jogo"
    });
    
    try {
      console.log(`🎮 Starting ML optimization for game: ${game.id}`);
      
      const { mlService } = await import("@/services/ml/mlService");
      
      const optimizationOptions = {
        optimizeRoutes: true,
        optimizeSettings: true,
        optimizeSystem: true,
        systemInfo: systemInfo || undefined
      };
      
      const result = await mlService.optimizeGame(game.id, optimizationOptions);
      
      setIsOptimizing(false);
      
      // Handle successful optimization
      if (result.success) {
        toast.success(`${game.name} otimizado com sucesso!`, {
          id: toastId,
          description: getSuccessDescription(result.optimizationType, result.improvements)
        });
        
        console.log(`✅ Game optimization successful:`, result);
        
        // Update game optimization status visually
        game.isOptimized = true;
        game.optimizationType = result.optimizationType;
      } else {
        throw new Error("Optimization did not complete successfully");
      }
    } catch (error: any) {
      console.error("🚨 Game optimization error:", error);
      setIsOptimizing(false);
      setOptimizationError(error.message || "Erro na otimização");
      
      if (error.message && (
        error.message.includes('redirect') || 
        error.message.includes('gamepathai.com')
      )) {
        toast.error(`Erro de redirecionamento ao otimizar ${game.name}`, {
          id: toastId,
          description: "Detecção de tentativa de redirecionamento. Consulte o console para mais detalhes."
        });
        
        console.error("🚨 Detalhes do erro de redirecionamento:", {
          gameId: game.id,
          gameName: game.name,
          errorMessage: error.message
        });
      } else {
        toast.error(`Erro ao otimizar ${game.name}`, {
          id: toastId,
          description: error.message || "Não foi possível completar a otimização"
        });
      }
    }
  };
  
  // Helper to get success message based on improvements
  const getSuccessDescription = (
    type: "network" | "system" | "both" | "none",
    improvements: { latency?: number; fps?: number; stability?: number }
  ) => {
    const messages = [];
    
    if (improvements) {
      if (improvements.latency) {
        messages.push(`${improvements.latency}% menos latência`);
      }
      
      if (improvements.fps) {
        messages.push(`${improvements.fps}% mais FPS`);
      }
      
      if (improvements.stability) {
        messages.push(`${improvements.stability}% mais estabilidade`);
      }
    }
    
    return messages.length > 0 ? messages.join(", ") : "Jogo otimizado com sucesso";
  };

  return {
    isOptimizing,
    optimizationProgress,
    optimizationError,
    handleOptimize
  };
};
