
import { useState } from "react";
import { toast } from "sonner";
import { Game } from "@/hooks/useGames";

export const useGameItemOptimization = (game: Game, onOptimize: (gameId: string) => void) => {
  const [localOptimizing, setLocalOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);

  const handleOptimizeWithProgress = () => {
    if (localOptimizing) return;
    
    setOptimizationError(null);
    setLocalOptimizing(true);
    setOptimizationProgress(10);
    
    // Simulate progress while optimization is happening
    const interval = setInterval(() => {
      setOptimizationProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);
    
    // Call the actual optimization function from the parent
    try {
      onOptimize(game.id);
      
      // After 2 seconds, complete the optimization
      setTimeout(() => {
        clearInterval(interval);
        setOptimizationProgress(100);
        setLocalOptimizing(false);
        
        // Reset progress after animation completes
        setTimeout(() => {
          setOptimizationProgress(0);
        }, 1000);
      }, 2000);
    } catch (error: any) {
      clearInterval(interval);
      setOptimizationError(error.message || "Erro na otimização");
      setLocalOptimizing(false);
      setOptimizationProgress(0);
    }
  };

  return {
    localOptimizing,
    optimizationProgress,
    optimizationError,
    handleOptimizeWithProgress
  };
};
