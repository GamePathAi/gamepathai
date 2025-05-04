
import React, { useEffect } from "react";
import { useAwsIntegration } from "@/hooks/useAwsIntegration";
import { useHardwareMonitoring } from "@/hooks/useHardwareMonitoring";
import { Button } from "@/components/ui/button";
import { RefreshCw, Server, AlertTriangle, Check, Cloud } from "lucide-react";
import { toast } from "sonner";

const AwsIntegrationStatus: React.FC = () => {
  const { isConnected, isLoading, error, services, checkConnection } = useAwsIntegration();
  const { data: hardwareData, startMonitoring, stopMonitoring } = useHardwareMonitoring();
  
  useEffect(() => {
    // Start hardware monitoring on component mount
    startMonitoring();
    
    // Clean up on unmount
    return () => {
      stopMonitoring();
    };
  }, []);
  
  const handleTestConnection = async () => {
    toast.info("Verificando conexão com AWS", {
      description: "Testando conectividade com o backend GamePath AI"
    });
    
    const connected = await checkConnection();
    if (connected) {
      toast.success("AWS Backend Conectado", {
        description: "Conexão com o backend GamePath AI estabelecida com sucesso"
      });
    } else {
      toast.error("AWS Backend Inacessível", {
        description: "Não foi possível conectar ao backend GamePath AI. As funções online podem estar indisponíveis."
      });
    }
  };
  
  const handleDetectGames = async () => {
    try {
      toast.info("Escaneando jogos", {
        description: "Por favor aguarde enquanto escaneamos seu sistema procurando jogos"
      });
      
      if (window.electron) {
        const games = await window.electron.detectGames();
        
        if (games && games.length > 0) {
          // Report detected games to backend
          await services.games.registerDetectedGames(games);
          
          toast.success("Jogos Detectados", {
            description: `Encontramos ${games.length} jogos no seu sistema`
          });
        } else {
          toast.info("Nenhum Jogo Encontrado", {
            description: "Nenhum jogo foi detectado em seu sistema"
          });
        }
      } else {
        // Web fallback - use backend detection
        const result = await services.games.detectGames();
        
        if (result.success) {
          toast.success("Detecção de Jogos Iniciada", {
            description: "O backend irá escanear seu sistema procurando jogos"
          });
        } else {
          toast.error("Detecção de Jogos Falhou", {
            description: result.message || "Não foi possível iniciar a detecção de jogos"
          });
        }
      }
    } catch (err) {
      console.error("Game detection error:", err);
      toast.error("Detecção de Jogos Falhou", {
        description: "Ocorreu um erro durante a detecção de jogos"
      });
    }
  };

  return (
    <div className="p-4 bg-cyber-darkblue border border-cyber-blue/30 rounded-lg">
      <h2 className="text-lg font-tech mb-4 flex items-center gap-2">
        <Cloud size={20} className="text-cyber-blue" />
        Integração AWS
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server size={18} className="text-cyber-blue" />
            <span>Status da Conexão:</span>
          </div>
          
          {isLoading ? (
            <span className="text-gray-400 flex items-center gap-1">
              <RefreshCw size={14} className="animate-spin" />
              Verificando...
            </span>
          ) : isConnected ? (
            <div className="flex items-center gap-1 text-cyber-green">
              <Check size={16} />
              <span>Conectado</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-cyber-red">
              <AlertTriangle size={16} />
              <span>Desconectado</span>
            </div>
          )}
        </div>
        
        {error && (
          <div className="p-2 bg-cyber-red/10 border border-cyber-red/30 rounded text-cyber-red text-sm">
            {error}
            <p className="text-xs mt-1 text-gray-400">Verifique sua conexão com a internet e se os serviços AWS estão disponíveis.</p>
          </div>
        )}
        
        {!isConnected && !isLoading && (
          <div className="p-2 bg-yellow-800/20 border border-yellow-600/30 rounded">
            <p className="text-yellow-300 text-sm">As funções que requerem o backend AWS estão indisponíveis. Algumas funcionalidades podem não funcionar corretamente.</p>
          </div>
        )}
        
        {hardwareData && isConnected && (
          <div className="p-2 bg-cyber-green/10 border border-cyber-green/30 rounded">
            <div className="text-xs text-gray-400 mb-1">Reportando métricas do sistema:</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>CPU: {hardwareData.cpu.usage.toFixed(1)}%</div>
              <div>RAM: {hardwareData.memory.usage.toFixed(1)}%</div>
              {hardwareData.gpu && (
                <div>GPU: {hardwareData.gpu.usage.toFixed(1)}%</div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex gap-2 mt-4">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
            onClick={handleTestConnection}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            Testar Conexão
          </Button>
          
          <Button
            variant="default"
            size="sm"
            className="bg-cyber-blue hover:bg-cyber-blue/90"
            onClick={handleDetectGames}
            disabled={!isConnected}
          >
            Detectar Jogos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AwsIntegrationStatus;
