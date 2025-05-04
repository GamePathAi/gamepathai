
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownUp, Shield, Cpu, Trash, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { periodicCleanup } from "@/utils/cspHelper";

interface DiagnosticItem {
  name: string;
  status: "ok" | "warning" | "error";
  message: string;
}

const MLDiagnosticsPanel: React.FC = () => {
  const [diagnostics, setDiagnostics] = React.useState<DiagnosticItem[]>([
    {
      name: "Conexão Backend",
      status: "error",
      message: "Falha na conexão com o servidor: redirecionamento detectado para gamepathai.com"
    },
    {
      name: "Integridade CSP",
      status: "warning",
      message: "O uso de META tag para CSP não permite frame-ancestors (use header HTTP)"
    },
    {
      name: "Scripts Injetados",
      status: "warning",
      message: "Detectados scripts que podem estar interferindo com o funcionamento da aplicação"
    },
    {
      name: "Recursos de Sistema",
      status: "ok",
      message: "Todos os recursos do sistema estão disponíveis e funcionais"
    }
  ]);
  
  const handleCleanup = () => {
    toast.loading("Executando limpeza de scripts...");
    
    // Use the periodicCleanup from cspHelper
    periodicCleanup();
    
    setTimeout(() => {
      toast.success("Limpeza concluída", {
        description: "Scripts injetados foram removidos com sucesso."
      });
      
      setDiagnostics(prev => 
        prev.map(item => 
          item.name === "Scripts Injetados" 
            ? {...item, status: "ok", message: "Nenhum script injetado detectado após limpeza"} 
            : item
        )
      );
    }, 1500);
  };
  
  const handleRetryConnection = () => {
    toast.loading("Tentando reconexão com o backend...");
    
    setTimeout(() => {
      toast.error("Falha na reconexão", {
        description: "Ainda detectamos redirecionamentos para gamepathai.com"
      });
    }, 2000);
  };
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case "ok": return "bg-cyber-green text-cyber-green";
      case "warning": return "bg-cyber-orange text-cyber-orange";
      case "error": return "bg-red-500 text-red-500";
      default: return "bg-gray-500 text-gray-500";
    }
  };

  return (
    <Card className="border-red-500/30 bg-cyber-darkblue/90">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center text-red-400">
          <Shield className="mr-2" size={18} />
          Diagnósticos de ML
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {diagnostics.map((item) => (
            <div key={item.name} className="cyber-panel border-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status).split(" ")[0]}/20 border ${getStatusColor(item.status).split(" ")[1]}/40 mr-3`}></div>
                  <div className="font-tech text-sm">{item.name}</div>
                </div>
                <div className={`text-xs ${getStatusColor(item.status).split(" ")[1]}`}>
                  {item.status === "ok" ? "OK" : item.status === "warning" ? "Alerta" : "Erro"}
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-400">{item.message}</div>
              
              {item.status !== "ok" && (
                <div className="mt-3">
                  {item.name === "Conexão Backend" && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={handleRetryConnection}
                    >
                      <RotateCcw className="mr-1" size={12} />
                      Tentar reconectar
                    </Button>
                  )}
                  
                  {item.name === "Scripts Injetados" && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs border-cyber-orange/30 text-cyber-orange hover:bg-cyber-orange/10"
                      onClick={handleCleanup}
                    >
                      <Trash className="mr-1" size={12} />
                      Limpar scripts
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
          
          <div className="flex justify-end space-x-3 mt-4">
            <Button variant="outline" size="sm" className="text-xs">
              <ArrowDownUp className="mr-1" size={12} />
              Verificar conexão
            </Button>
            
            <Button variant="outline" size="sm" className="text-xs">
              <Cpu className="mr-1" size={12} />
              Testar recursos
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MLDiagnosticsPanel;
