
import React, { useState } from "react";
import { Check, Shield, Zap, Settings, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Game } from "@/hooks/useGames";
import { Progress } from "@/components/ui/progress";
import { mlService } from "@/services/mlApiClient";
import { toast } from "sonner";

interface GameOptimizationStatus {
  text: string;
  color: string;
  icon?: React.ReactNode;
}

interface GameListItemProps {
  game: Game;
  onOptimize: (gameId: string) => void;
  onOpenSettings: (game: Game) => void;
  isOptimizing: boolean;
}

const GameListItem: React.FC<GameListItemProps> = ({
  game,
  onOptimize,
  onOpenSettings,
  isOptimizing
}) => {
  const [localOptimizing, setLocalOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  
  const getOptimizationStatus = (game: Game): GameOptimizationStatus => {
    if (!game.isOptimized) return { text: "NOT OPTIMIZED", color: "text-gray-400" };
    
    switch (game.optimizationType) {
      case "both": 
        return { 
          text: "FULLY OPTIMIZED", 
          color: "text-green-400",
          icon: <Check size={14} className="mr-1" />
        };
      case "network": 
        return { 
          text: "NETWORK OPTIMIZED", 
          color: "text-cyber-blue",
          icon: <Shield size={14} className="mr-1" /> 
        };
      case "system": 
        return { 
          text: "SYSTEM OPTIMIZED", 
          color: "text-cyber-purple",
          icon: <Zap size={14} className="mr-1" /> 
        };
      default: 
        return { text: "NOT OPTIMIZED", color: "text-gray-400" };
    }
  };

  const optimizationStatus = getOptimizationStatus(game);
  
  // MELHORADO: Direct ML service call with progress simulation
  const handleOptimizeWithProgress = async () => {
    if (localOptimizing || isOptimizing) return;
    
    setOptimizationError(null);
    setLocalOptimizing(true);
    setOptimizationProgress(10);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setOptimizationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 5;
      });
    }, 300);
    
    try {
      // Show toast notification
      const toastId = toast.loading(`Otimizando ${game.name}...`, {
        description: "Aplicando configurações otimizadas por IA"
      });
      
      // Registro detalhado da solicitação ML para diagnóstico
      console.log(`🎮 Iniciando otimização para ${game.name} (ID: ${game.id})`);
      
      // MELHORADO: Call ML service directly with enhanced options
      const result = await mlService.optimizeGame(game.id, {
        optimizeRoutes: true,
        optimizeSettings: true,
        optimizeSystem: true,
        // NOVO: Enviar dados adicionais para melhorar resultados ML
        aggressiveness: 'medium'
      });
      
      // Complete progress
      clearInterval(progressInterval);
      setOptimizationProgress(100);
      
      console.log(`✅ Otimização concluída para ${game.name}:`, result);
      
      // Show success message
      if (result.success) {
        // Create descriptive message based on improvements
        const improvements = result.improvements || {};
        const messages = [];
        
        if (improvements.latency) {
          messages.push(`${improvements.latency}% menos latência`);
        }
        
        if (improvements.fps) {
          messages.push(`${improvements.fps}% mais FPS`);
        }
        
        if (improvements.stability) {
          messages.push(`${improvements.stability}% mais estabilidade`);
        }
        
        toast.success(`${game.name} otimizado com sucesso!`, {
          id: toastId,
          description: messages.length > 0 ? messages.join(", ") : "Jogo otimizado com sucesso"
        });
        
        // Atualizar localmente o status do jogo para feedback imediato
        game.isOptimized = true;
        game.optimizationType = result.optimizationType;
      } else {
        throw new Error("Optimization did not complete successfully");
      }
      
      // Call the parent handler to update global state
      onOptimize(game.id);
      
      // Reset local state after a delay to show the completed progress
      setTimeout(() => {
        setLocalOptimizing(false);
        setOptimizationProgress(0);
      }, 1000);
      
    } catch (error: any) {
      // MELHORADO: Tratamento de erros mais detalhado
      clearInterval(progressInterval);
      setOptimizationError(error.message || "Falha na otimização");
      setOptimizationProgress(0);
      setLocalOptimizing(false);
      
      console.error("Game optimization error:", error);
      
      // NOVO: Verificar se o erro está relacionado a redirecionamentos
      if (error.message && (
        error.message.includes('redirect') || 
        error.message.includes('gamepathai.com')
      )) {
        toast.error(`Erro de redirecionamento ao otimizar ${game.name}`, {
          description: "Um redirecionamento foi detectado e bloqueado. Verifique o console para mais detalhes."
        });
        
        // Registrar mais detalhes para diagnóstico
        console.error("🚨 Redirecionamento detectado durante otimização:", {
          game: game.name,
          id: game.id,
          errorDetails: error
        });
      } else {
        toast.error(`Erro ao otimizar ${game.name}`, {
          description: error.message || "Não foi possível completar a otimização"
        });
      }
    }
  };

  return (
    <div 
      className="bg-cyber-darkblue border border-cyber-blue/30 rounded-md overflow-hidden flex justify-between items-center shadow-lg hover:border-cyber-blue/50 transition-all duration-300"
    >
      <div className="flex items-center">
        <div className="w-16 h-16 shrink-0 overflow-hidden">
          <img 
            src={game.image} 
            alt={game.name} 
            className="w-full h-full object-cover shadow-inner"
          />
        </div>
        <div className="p-3">
          <h3 className="text-white font-cyber text-lg">{game.name}</h3>
          <div className="text-gray-400 text-xs font-tech">{game.genre}</div>
          
          {/* Show optimization progress */}
          {optimizationProgress > 0 && (
            <div className="mt-1 w-48">
              <Progress value={optimizationProgress} className="h-1" />
              {localOptimizing && (
                <span className="text-xs text-cyber-blue mt-1">Aplicando otimização...</span>
              )}
            </div>
          )}
          
          {/* Show error message if any */}
          {optimizationError && (
            <div className="flex items-center text-xs text-red-400 mt-1">
              <AlertCircle size={12} className="mr-1" />
              {optimizationError}
            </div>
          )}
        </div>
      </div>
      
      <div className="pr-4 flex flex-col items-end">
        <div className={`flex items-center text-xs font-tech ${optimizationStatus.color} mb-2`}>
          {optimizationStatus.icon}
          {optimizationStatus.text}
        </div>
        
        <div className="flex space-x-2">
          {(!game.isOptimized || game.optimizationType !== "both") && (
            <Button 
              onClick={handleOptimizeWithProgress}
              variant="cyber"
              size="sm"
              disabled={isOptimizing || localOptimizing}
              className="bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/50 hover:bg-cyber-blue/30 text-xs px-3 py-1 transition-colors"
            >
              {isOptimizing || localOptimizing ? (
                <Loader2 size={14} className="mr-1 animate-spin" />
              ) : (
                <Zap size={14} className="mr-1" />
              )}
              {isOptimizing || localOptimizing ? "Otimizando..." : "Otimizar"}
            </Button>
          )}
          <Button
            onClick={() => onOpenSettings(game)}
            variant="outline"
            size="sm"
            className="bg-cyber-darkblue/80 text-gray-400 border border-gray-500/30 hover:bg-cyber-darkblue hover:text-white hover:border-cyber-blue/50 p-1 transition-all"
            title="Game Settings"
          >
            <Settings size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GameListItem;
