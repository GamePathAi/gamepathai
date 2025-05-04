
import { useState, useEffect } from 'react';
import { usePermissions } from '@/contexts/PermissionsContext';
import { electronApiService } from '@/services/electron/electronApiService';
import { toast } from "sonner";

interface NetworkData {
  ping: number;
  jitter: number;
  packetLoss: number;
  timestamp: number;
  server?: string;
}

export const useSecureNetworkMonitoring = (server = '8.8.8.8', interval = 5000) => {
  const [data, setData] = useState<NetworkData | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [monitoringInterval, setMonitoringInterval] = useState<number | null>(null);
  const { hasPermission, requestPermission } = usePermissions();
  
  const startMonitoring = async () => {
    // Check permission first
    if (!hasPermission("network_tools")) {
      const granted = await requestPermission("network_tools");
      if (!granted) {
        setError("Permissão para ferramentas de rede negada");
        toast.error("Permissão negada", {
          description: "O monitoramento de rede requer permissão para acessar recursos do sistema"
        });
        return false;
      }
    }
    
    // Stop existing monitoring if active
    if (monitoringInterval !== null) {
      stopMonitoring();
    }
    
    try {
      // Perform initial ping
      const initialData = await electronApiService.pingServer(server);
      setData(initialData);
      
      // Setup interval for continuous monitoring
      const intervalId = window.setInterval(async () => {
        try {
          const newData = await electronApiService.pingServer(server);
          setData(newData);
        } catch (err) {
          console.error('Erro durante o monitoramento de rede:', err);
        }
      }, interval);
      
      setMonitoringInterval(intervalId as unknown as number);
      setIsMonitoring(true);
      setError(null);
      
      toast.success("Monitoramento de rede iniciado", {
        description: `Monitorando servidor ${server}`
      });
      
      return true;
    } catch (err) {
      console.error('Erro ao iniciar o monitoramento de rede:', err);
      setError('Falha ao iniciar o monitoramento de rede');
      return false;
    }
  };
  
  const stopMonitoring = () => {
    if (monitoringInterval !== null) {
      window.clearInterval(monitoringInterval);
      setMonitoringInterval(null);
      setIsMonitoring(false);
      toast.info("Monitoramento de rede parado");
      return true;
    }
    return false;
  };
  
  useEffect(() => {
    // Start monitoring automatically if permission is granted
    if (hasPermission("network_tools")) {
      startMonitoring();
    }
    
    // Cleanup function
    return () => {
      stopMonitoring();
    };
  }, [server, interval, hasPermission]);
  
  // Function to check a specific server on demand
  const checkServer = async (targetServer: string) => {
    if (!hasPermission("network_tools")) {
      const granted = await requestPermission("network_tools");
      if (!granted) {
        setError("Permissão para ferramentas de rede negada");
        return null;
      }
    }
    
    try {
      return await electronApiService.pingServer(targetServer);
    } catch (err) {
      console.error(`Erro ao verificar servidor ${targetServer}:`, err);
      return null;
    }
  };
  
  // Function to trace route to a server
  const traceRoute = async (targetServer: string) => {
    if (!hasPermission("network_tools")) {
      const granted = await requestPermission("network_tools");
      if (!granted) {
        setError("Permissão para ferramentas de rede negada");
        return null;
      }
    }
    
    try {
      return await electronApiService.traceRoute(targetServer);
    } catch (err) {
      console.error(`Erro ao traçar rota para ${targetServer}:`, err);
      return null;
    }
  };
  
  return {
    data,
    isMonitoring,
    error,
    startMonitoring,
    stopMonitoring,
    checkServer,
    traceRoute,
    isPermissionGranted: hasPermission("network_tools")
  };
};
