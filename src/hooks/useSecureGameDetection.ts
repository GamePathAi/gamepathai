
import { useState, useEffect } from 'react';
import { usePermissions } from '@/contexts/PermissionsContext';
import { electronApiService } from '@/services/electron/electronApiService';
import { toast } from "sonner";

export interface Game {
  id: string;
  name: string;
  executable: string;
  path: string;
  platform: string;
  lastPlayed: number;
  genre?: string; // Added genre as optional property to match both usages
}

export const useSecureGameDetection = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { hasPermission, requestPermission } = usePermissions();
  
  const detectGames = async () => {
    // Check permission first
    if (!hasPermission("game_detection")) {
      const granted = await requestPermission("game_detection");
      if (!granted) {
        setError("Permissão para detecção de jogos negada");
        toast.error("Permissão negada", {
          description: "A detecção de jogos requer permissão para acessar informações do sistema"
        });
        return false;
      }
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const detectedGames = await electronApiService.detectGames();
      setGames(detectedGames);
      
      toast.success("Jogos detectados", {
        description: `${detectedGames.length} jogos encontrados no sistema`
      });
      
      return true;
    } catch (err) {
      console.error('Erro ao detectar jogos:', err);
      setError('Falha ao detectar jogos');
      
      toast.error("Erro ao detectar jogos", {
        description: "Não foi possível verificar os jogos instalados"
      });
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set up game detection listener
  useEffect(() => {
    let removeListener: (() => void) | null = null;
    
    const setupGameDetection = async () => {
      if (hasPermission("game_detection")) {
        try {
          // Initial game detection
          await detectGames();
          
          // Set up event listener for new games
          removeListener = electronApiService.onGameDetected((gameData: Game) => {
            setGames(prev => {
              // Check if game already exists
              const exists = prev.some(game => game.id === gameData.id);
              if (exists) return prev;
              
              toast.info(`Novo jogo detectado: ${gameData.name}`);
              return [...prev, gameData];
            });
          });
        } catch (err) {
          console.error('Erro ao configurar detecção de jogos:', err);
        }
      }
    };
    
    setupGameDetection();
    
    // Cleanup function
    return () => {
      if (removeListener) {
        removeListener();
      }
    };
  }, [hasPermission]);
  
  return {
    games,
    isLoading,
    error,
    detectGames,
    isPermissionGranted: hasPermission("game_detection")
  };
};
