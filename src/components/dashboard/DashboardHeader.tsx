
import React from "react";
import { Zap, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  backendStatus: 'online' | 'offline' | 'checking';
  isOptimizing: boolean;
  handleOptimizeAll: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  backendStatus,
  isOptimizing,
  handleOptimizeAll
}) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h1 className="text-2xl font-cyber font-bold text-white mb-1">Dashboard</h1>
        <p className="text-gray-400 text-sm">Monitor e otimização da sua conexão de jogos</p>
      </div>
      
      <div className="flex items-center gap-2">
        {backendStatus === 'online' && (
          <div className="text-xs font-tech bg-cyber-green/20 text-cyber-green border border-cyber-green/30 px-3 py-1.5 rounded flex items-center gap-2">
            <Server size={14} />
            Servidor Conectado
          </div>
        )}
        
        <Button
          variant="cyberAction"
          onClick={handleOptimizeAll}
          disabled={isOptimizing}
        >
          {isOptimizing ? (
            <>
              <span className={cn("mr-1", isOptimizing && "animate-pulse")}>⚡</span>
              OTIMIZANDO...
            </>
          ) : (
            <>
              <Zap className="mr-1" size={16} />
              OTIMIZAR TUDO
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeader;
