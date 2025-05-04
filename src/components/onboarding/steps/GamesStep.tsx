
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Gamepad2, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

// Mock de jogos detectados
const mockGames = [
  { id: 1, name: "Counter-Strike 2", path: "C:/Games/Steam/CS2", icon: "🎮" },
  { id: 2, name: "League of Legends", path: "C:/Riot Games/League of Legends", icon: "🎮" },
  { id: 3, name: "Fortnite", path: "C:/Epic Games/Fortnite", icon: "🎮" },
  { id: 4, name: "Valorant", path: "C:/Riot Games/VALORANT", icon: "🎮" }
];

const GamesStep: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [games, setGames] = useState<typeof mockGames>([]);
  
  const handleScan = () => {
    setScanning(true);
    
    // Simular detecção de jogos
    setTimeout(() => {
      setGames(mockGames);
      setScanning(false);
      setScanned(true);
    }, 2500);
  };
  
  return (
    <div className="flex flex-col p-10 h-[500px]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl font-tech font-bold text-white mb-2">Detecção de Jogos</h2>
        <p className="text-gray-300">
          Vamos encontrar seus jogos instalados para que o GamePath AI possa otimizá-los automaticamente.
        </p>
      </motion.div>
      
      <div className="mb-6">
        <div className="flex gap-3 mb-4">
          <Input 
            placeholder="Diretório de jogos (opcional)" 
            className="bg-cyber-darkblue/50 border-cyber-blue/30"
          />
          <Button variant="cyberOutline">Procurar</Button>
        </div>
        
        <Button 
          variant={scanned ? "cyberGreen" : "cyberAction"}
          className="w-full"
          onClick={handleScan}
          disabled={scanning}
        >
          {scanning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Escaneando sistema...
            </>
          ) : scanned ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Jogos detectados
            </>
          ) : (
            <>
              <Search className="mr-2 h-4 w-4" />
              Detectar jogos automaticamente
            </>
          )}
        </Button>
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex-1 overflow-hidden"
      >
        <div className="border border-cyber-blue/20 rounded-lg overflow-hidden bg-cyber-darkblue/30 h-full">
          <div className="p-3 border-b border-cyber-blue/20 bg-cyber-darkblue/50">
            <h3 className="text-sm font-medium text-cyber-blue flex items-center">
              <Gamepad2 className="mr-2 h-4 w-4" />
              Jogos Detectados
            </h3>
          </div>
          
          <div className="p-2 max-h-[250px] overflow-y-auto">
            {scanning ? (
              // Skeletons para carregamento
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border-b border-cyber-blue/10">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-72" />
                    </div>
                  </div>
                ))}
              </>
            ) : scanned ? (
              // Jogos detectados
              games.map((game) => (
                <div key={game.id} className="flex items-center p-3 border-b border-cyber-blue/10 hover:bg-cyber-blue/5">
                  <div className="flex-shrink-0 h-8 w-8 bg-cyber-blue/20 rounded-md flex items-center justify-center text-lg">
                    {game.icon}
                  </div>
                  <div className="ml-3">
                    <p className="text-white font-medium">{game.name}</p>
                    <p className="text-gray-400 text-xs">{game.path}</p>
                  </div>
                  <div className="ml-auto">
                    <div className="text-xs text-cyber-green flex items-center">
                      <Check size={12} className="mr-1" />
                      Pronto para otimização
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // Estado vazio
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-400">
                <Gamepad2 className="h-12 w-12 mb-3 text-gray-500" />
                <p className="mb-1">Nenhum jogo detectado</p>
                <p className="text-xs">Clique em "Detectar jogos automaticamente" para escanear seu sistema</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GamesStep;
