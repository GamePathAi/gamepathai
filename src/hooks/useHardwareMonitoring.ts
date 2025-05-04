
import { useState, useEffect, useCallback } from "react";
import { usePermissions } from "@/contexts/PermissionsContext";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export interface HardwareData {
  cpu: {
    usage: number;
    temperature?: number;
    cores?: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  gpu?: {
    usage: number;
    temperature?: number;
    memoryTotal?: number;
    memoryUsed?: number;
  };
  disk?: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network?: {
    download: number;
    upload: number;
  };
  timestamp: number;
}

interface HardwareMonitoringOptions {
  interval?: number;
  onError?: (error: Error) => void;
  reportToCloud?: boolean;
}

export const useHardwareMonitoring = (options: HardwareMonitoringOptions = {}) => {
  const { hasPermission, requestPermission } = usePermissions();
  const { t } = useTranslation();
  
  const [data, setData] = useState<HardwareData | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const defaultOptions = {
    interval: 2000, // 2 seconds
    reportToCloud: false,
    ...options
  };
  
  // Function to start monitoring
  const startMonitoring = useCallback(async () => {
    // Check if we have permission first
    if (!hasPermission("hardware_monitoring")) {
      try {
        const granted = await requestPermission("hardware_monitoring");
        if (!granted) {
          throw new Error("Hardware monitoring permission denied");
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to request permission"));
        if (options.onError) options.onError(err instanceof Error ? err : new Error("Failed to request permission"));
        
        toast.error(t("hardware.permissionError"), {
          description: t("hardware.permissionRequired")
        });
        
        return false;
      }
    }
    
    // Start monitoring if we have Electron access
    if (window.electron) {
      try {
        // Request initial hardware info
        const initialData = await window.electron.getHardwareInfo();
        setData(initialData);
        
        // Start continuous monitoring
        const started = await window.electron.startHardwareMonitoring(defaultOptions.interval);
        
        if (!started) {
          throw new Error("Failed to start hardware monitoring");
        }
        
        // Set up listener for hardware updates
        const cleanup = window.electron.onHardwareUpdate((newData) => {
          setData(newData);
          
          // Report to cloud if enabled
          if (defaultOptions.reportToCloud && hasPermission("hardware_monitoring")) {
            reportHardwareData(newData).catch(console.error);
          }
        });
        
        setIsMonitoring(true);
        setError(null);
        
        // Return cleanup function
        return cleanup;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to start hardware monitoring"));
        if (options.onError) options.onError(err instanceof Error ? err : new Error("Failed to start hardware monitoring"));
        
        toast.error(t("hardware.monitoringError"), {
          description: t("hardware.tryAgain")
        });
        
        return false;
      }
    } else {
      // Fallback for web version (simulated data)
      const intervalId = setInterval(() => {
        const mockData: HardwareData = {
          cpu: {
            usage: 25 + Math.random() * 20,
            temperature: 45 + Math.random() * 15,
            cores: Array(8).fill(0).map(() => Math.random() * 100)
          },
          memory: {
            total: 16000,
            used: 4000 + Math.random() * 3000,
            free: 9000 - Math.random() * 3000,
            usage: 25 + Math.random() * 20
          },
          gpu: {
            usage: 30 + Math.random() * 20,
            temperature: 50 + Math.random() * 15,
            memoryTotal: 8000,
            memoryUsed: 2000 + Math.random() * 1500
          },
          timestamp: Date.now()
        };
        
        setData(mockData);
      }, defaultOptions.interval);
      
      setIsMonitoring(true);
      
      // Return cleanup function for web version
      return () => clearInterval(intervalId);
    }
  }, [hasPermission, requestPermission, options, defaultOptions.interval, defaultOptions.reportToCloud, t]);
  
  // Function to stop monitoring
  const stopMonitoring = useCallback(async () => {
    if (window.electron) {
      try {
        await window.electron.stopHardwareMonitoring();
        setIsMonitoring(false);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to stop hardware monitoring"));
        if (options.onError) options.onError(err instanceof Error ? err : new Error("Failed to stop hardware monitoring"));
        return false;
      }
    } else {
      // For web version, we just need to return true since the cleanup is handled
      // by the function returned from startMonitoring
      setIsMonitoring(false);
      return true;
    }
  }, [options]);
  
  // Report hardware data to cloud service
  const reportHardwareData = async (hardwareData: HardwareData) => {
    try {
      // Only send data to server if we're running in Electron and have permission
      if (window.electron && hasPermission("hardware_monitoring")) {
        // Here we would typically call a service to report data
        // For now we're just logging to console
        console.log("Reporting hardware data to cloud:", hardwareData);
        
        // In a real implementation, this would be:
        // await metricsService.reportSystemMetrics({
        //   cpu: hardwareData.cpu,
        //   gpu: hardwareData.gpu,
        //   memory: hardwareData.memory
        // });
      }
    } catch (err) {
      console.error("Failed to report hardware data:", err);
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (isMonitoring && window.electron) {
        window.electron.stopHardwareMonitoring().catch(console.error);
      }
    };
  }, [isMonitoring]);
  
  return {
    data,
    isMonitoring,
    error,
    startMonitoring,
    stopMonitoring
  };
};
