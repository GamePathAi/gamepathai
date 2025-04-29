
import React, { useState, useEffect } from "react";
import { Zap, Settings, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import EnhancedGameSettingsModal from "./GameSpecificSettings/EnhancedGameSettingsModal";
import { mlService } from "@/services/mlApiClient";
import { useSystemInfo } from "@/hooks/useSystemInfo";

interface GameCardProps {
  game: {
    id: string;
    name: string;
    image: string;
    isOptimized: boolean;
    genre: string;
    optimizationType?: "network" | "system" | "both" | "none";
  };
}

const GameCard: React.FC<GameCardProps> = ({ game }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  const { systemInfo } = useSystemInfo();
  
  useEffect(() => {
    // Clear error state when game changes
    setOptimizationError(null);
  }, [game.id]);
  
  // Simulate optimization progress
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
  }, [isOptimizing]);

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
      
      // MELHORADO: Enviar explicitamente configurações adicionais
      const optimizationOptions = {
        optimizeRoutes: true,
        optimizeSettings: true,
        optimizeSystem: true,
        // Enviar informações do sistema se disponíveis
        systemInfo: systemInfo || undefined
      };
      
      // MODIFICADO: Call the ML service directly, not through gamesService
      const result = await mlService.optimizeGame(game.id, optimizationOptions);
      
      setIsOptimizing(false);
      
      // Handle successful optimization
      if (result.success) {
        toast.success(`${game.name} otimizado com sucesso!`, {
          id: toastId,
          description: getSuccessDescription(result.optimizationType, result.improvements)
        });
        
        console.log(`✅ Game optimization successful:`, result);
        
        // Atualizar visualmente o status de otimização do jogo
        // Nota: Isso é temporário até que a lista de jogos seja atualizada pelo hook useGames
        game.isOptimized = true;
        game.optimizationType = result.optimizationType;
      } else {
        throw new Error("Optimization did not complete successfully");
      }
    } catch (error: any) {
      console.error("🚨 Game optimization error:", error);
      setIsOptimizing(false);
      setOptimizationError(error.message || "Erro na otimização");
      
      // MELHORADO: Verificar se o erro é relacionado a redirecionamento
      if (error.message && (
        error.message.includes('redirect') || 
        error.message.includes('gamepathai.com')
      )) {
        toast.error(`Erro de redirecionamento ao otimizar ${game.name}`, {
          id: toastId,
          description: "Detecção de tentativa de redirecionamento. Consulte o console para mais detalhes."
        });
        
        // Adicionar logs detalhados para diagnóstico
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

  const getOptimizationLabel = () => {
    switch (game.optimizationType) {
      case "network":
        return "REDE OTIMIZADA";
      case "system":
        return "SISTEMA OTIMIZADO";
      case "both":
        return "TOTALMENTE OTIMIZADO";
      default:
        return "NÃO OTIMIZADO";
    }
  };

  const getOptimizationColor = () => {
    switch (game.optimizationType) {
      case "network":
        return "text-cyber-blue border-cyber-blue";
      case "system":
        return "text-cyber-purple border-cyber-purple";
      case "both":
        return "text-green-400 border-green-400";
      default:
        return "text-gray-400 border-gray-400";
    }
  };

  return (
    <>
      <div className="cyber-panel h-full flex flex-col">
        <div className="relative mb-3 overflow-hidden rounded">
          <img 
            src={game.image} 
            alt={game.name} 
            className="w-full h-32 object-cover hover-scale" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-cyber-black to-transparent"></div>
          <div className="absolute bottom-2 left-2 text-xs font-tech bg-cyber-darkblue/80 px-2 py-1 rounded border border-cyber-blue/30">
            {game.genre}
          </div>
        </div>
        
        <h3 className="text-lg font-cyber font-semibold mb-1 text-white">{game.name}</h3>
        
        <div className="mb-3">
          <span className={cn("text-xs font-tech px-1.5 py-0.5 rounded border", getOptimizationColor())}>
            {getOptimizationLabel()}
          </span>
        </div>
        
        {/* Optimization progress bar */}
        {optimizationProgress > 0 && (
          <div className="mb-3">
            <div className="h-1 w-full bg-gray-700 rounded overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyber-blue to-cyber-purple transition-all duration-300"
                style={{ width: `${optimizationProgress}%` }}
              ></div>
            </div>
            {isOptimizing && (
              <p className="text-xs text-gray-400 mt-1">Aplicando IA ao jogo...</p>
            )}
          </div>
        )}
        
        {/* Error message if optimization failed */}
        {optimizationError && (
          <div className="mb-3 text-xs text-red-400 flex items-center">
            <AlertCircle size={12} className="mr-1" />
            {optimizationError}
          </div>
        )}
        
        <div className="mt-auto flex space-x-2">
          <Button 
            onClick={handleOptimize}
            className="flex-1 bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50 hover:bg-cyber-blue/30"
            variant="outline"
            disabled={isOptimizing || (game.isOptimized && game.optimizationType === 'both')}
          >
            {isOptimizing ? (
              <span className="animate-pulse mr-1">⚡</span>
            ) : (
              <Zap className="mr-1" size={16} />
            )}
            {isOptimizing ? "Otimizando..." : "Otimizar"}
          </Button>
          <Button 
            className="bg-cyber-darkblue/80 text-gray-400 border border-gray-500/30 hover:bg-cyber-darkblue hover:text-white"
            variant="outline"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            disabled={isOptimizing}
          >
            <Settings size={16} />
          </Button>
        </div>
      </div>

      <EnhancedGameSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        game={game}
      />
    </>
  );
};

export default GameCard;
