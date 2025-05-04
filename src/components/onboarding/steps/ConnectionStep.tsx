
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Server, RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const ConnectionStep: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const testConnection = () => {
    setIsConnecting(true);
    setProgress(0);
    
    // Simular progresso de conexão
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 20;
        if (newProgress >= 100) {
          clearInterval(interval);
          setIsConnecting(false);
          setIsConnected(true);
          return 100;
        }
        return newProgress;
      });
    }, 500);
  };
  
  return (
    <div className="flex flex-col p-10 h-[500px]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-tech font-bold text-white mb-2">Conectividade com Servidores</h2>
        <p className="text-gray-300 mb-8">
          O GamePath AI precisa se conectar aos servidores na AWS para oferecer funcionalidades avançadas de otimização e monitoramento.
        </p>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-cyber-darkblue/30 border border-cyber-blue/20 rounded-lg p-6 mb-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-cyber-blue/20 p-3 rounded-full">
            <Server className="text-cyber-blue h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Servidores GamePath AI</h3>
            <p className="text-sm text-gray-400">Infraestrutura global para otimização de jogos</p>
          </div>
          <div className="ml-auto">
            {isConnected ? (
              <div className="bg-cyber-green/20 text-cyber-green px-3 py-1 rounded-full flex items-center">
                <Check size={14} className="mr-1" />
                <span className="text-xs">Conectado</span>
              </div>
            ) : (
              <div className="bg-amber-800/20 text-amber-400 px-3 py-1 rounded-full text-xs">
                Não conectado
              </div>
            )}
          </div>
        </div>
        
        {(isConnecting || isConnected) && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progresso da conexão</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        <Button 
          variant={isConnected ? "cyberGreen" : "cyberAction"}
          className="w-full"
          onClick={testConnection}
          disabled={isConnecting || isConnected}
        >
          {isConnecting ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Conectando...
            </>
          ) : isConnected ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Conexão Estabelecida
            </>
          ) : (
            "Testar Conexão"
          )}
        </Button>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-sm text-gray-400"
      >
        <p className="mb-2">
          <strong className="text-cyber-blue">Nota:</strong> A conexão com os servidores AWS permite:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Análises avançadas de rotas de rede</li>
          <li>Otimizações de conexão em tempo real</li>
          <li>Atualizações automáticas de configurações</li>
          <li>Armazenamento de suas preferências</li>
        </ul>
      </motion.div>
    </div>
  );
};

export default ConnectionStep;
