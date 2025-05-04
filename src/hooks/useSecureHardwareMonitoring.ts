
import { useState, useEffect } from 'react';
import { usePermissions } from '@/contexts/PermissionsContext';
import { electronApiService } from '@/services/electron/electronApiService';
import { toast } from "sonner";
import { HardwareData } from '../services/hardware/hardwareMonitor';

export const useSecureHardwareMonitoring = (interval = 1000) => {
  const [data, setData] = useState<HardwareData | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { hasPermission, requestPermission } = usePermissions();
  
  const startMonitoring = async () => {
    // Check permission first
    if (!hasPermission("hardware_monitoring")) {
      const granted = await requestPermission("hardware_monitoring");
      if (!granted) {
        setError("Permissão para monitoramento de hardware negada");
        toast.error("Permissão negada", {
          description: "O monitoramento de hardware requer permissão para acessar informações do sistema"
        });
        return false;
      }
    }
    
    try {
      const success = await electronApiService.startHardwareMonitoring(interval);
      
      if (success) {
        setIsMonitoring(true);
        setError(null);
        toast.success("Monitoramento de hardware iniciado", {
          description: "Monitorando CPU, memória e GPU"
        });
      } else {
        setError('Falha ao iniciar o monitoramento de hardware');
      }
      
      return success;
    } catch (err) {
      console.error('Erro ao iniciar o monitoramento de hardware:', err);
      setError('Falha ao iniciar o monitoramento de hardware');
      return false;
    }
  };
  
  const stopMonitoring = async () => {
    try {
      const success = await electronApiService.stopHardwareMonitoring();
      
      if (success) {
        setIsMonitoring(false);
        toast.info("Monitoramento de hardware parado");
      }
      
      return success;
    } catch (err) {
      console.error('Erro ao parar o monitoramento de hardware:', err);
      return false;
    }
  };
  
  useEffect(() => {
    // Set up hardware update listener
    let removeListener: (() => void) | null = null;
    
    const setupMonitoring = async () => {
      if (hasPermission("hardware_monitoring")) {
        // Get initial hardware info
        try {
          const initialData = await electronApiService.getHardwareInfo();
          setData(initialData);
          
          // Set up event listener
          removeListener = electronApiService.onHardwareUpdate((newData: HardwareData) => {
            setData(newData);
          });
          
          // Start monitoring automatically if permission is already granted
          startMonitoring();
        } catch (err) {
          console.error('Failed to set up hardware monitoring:', err);
          setError('Failed to set up hardware monitoring');
        }
      }
    };
    
    setupMonitoring();
    
    // Cleanup function
    return () => {
      if (removeListener) {
        removeListener();
      }
      stopMonitoring();
    };
  }, [interval, hasPermission]);
  
  return {
    data,
    isMonitoring,
    error,
    startMonitoring,
    stopMonitoring,
    isPermissionGranted: hasPermission("hardware_monitoring")
  };
};
