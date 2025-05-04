
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { HardwareData } from "@/types/metrics";

/**
 * Service responsible for hardware monitoring functionality
 */
export class HardwareMonitoringService {
  private static instance: HardwareMonitoringService;
  
  /**
   * Gets singleton instance of the service
   */
  public static getInstance(): HardwareMonitoringService {
    if (!HardwareMonitoringService.instance) {
      HardwareMonitoringService.instance = new HardwareMonitoringService();
    }
    return HardwareMonitoringService.instance;
  }

  /**
   * Checks if the app has hardware monitoring permission
   */
  public async checkPermission(hasPermission: (type: string) => boolean, 
                              requestPermission: (type: string) => Promise<boolean>,
                              t: (key: string) => string): Promise<boolean> {
    // Check if we have permission first
    if (!hasPermission("hardware_monitoring")) {
      try {
        const granted = await requestPermission("hardware_monitoring");
        if (!granted) {
          throw new Error("Hardware monitoring permission denied");
        }
      } catch (err) {
        toast.error(t("hardware.permissionError"), {
          description: t("hardware.permissionRequired")
        });
        
        return false;
      }
    }
    
    return true;
  }

  /**
   * Starts hardware monitoring
   */
  public async startMonitoring(
    interval: number,
    onData: (data: HardwareData) => void,
    onError: (error: Error) => void,
    t: (key: string) => string,
    hasPermission: (type: string) => boolean
  ): Promise<() => void | undefined> {
    // Start monitoring if we have Electron access
    if (window.electron) {
      try {
        // Request initial hardware info
        const initialData = await window.electron.getHardwareInfo();
        onData(initialData);
        
        // Start continuous monitoring
        const started = await window.electron.startHardwareMonitoring(interval);
        
        if (!started) {
          throw new Error("Failed to start hardware monitoring");
        }
        
        // Set up listener for hardware updates
        const cleanup = window.electron.onHardwareUpdate((newData) => {
          onData(newData);
          
          // Report to cloud if enabled
          if (hasPermission("hardware_monitoring")) {
            this.reportHardwareData(newData).catch(console.error);
          }
        });
        
        return cleanup;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to start hardware monitoring");
        onError(error);
        
        toast.error(t("hardware.monitoringError"), {
          description: t("hardware.tryAgain")
        });
        
        return undefined;
      }
    } else {
      // Fallback for web version (simulated data)
      const intervalId = setInterval(() => {
        const mockData: HardwareData = this.generateMockData();
        onData(mockData);
      }, interval);
      
      return () => clearInterval(intervalId);
    }
  }
  
  /**
   * Stops hardware monitoring
   */
  public async stopMonitoring(onError: (error: Error) => void): Promise<boolean> {
    if (window.electron) {
      try {
        await window.electron.stopHardwareMonitoring();
        return true;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to stop hardware monitoring");
        onError(error);
        return false;
      }
    }
    
    // For web version, we just need to return true since the cleanup is handled
    // by the function returned from startMonitoring
    return true;
  }

  /**
   * Generates mock hardware data for web environments
   */
  private generateMockData(): HardwareData {
    return {
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
  }

  /**
   * Reports hardware data to cloud service
   */
  private async reportHardwareData(hardwareData: HardwareData): Promise<void> {
    try {
      // Only send data to server if we're running in Electron
      if (window.electron) {
        // Here we would typically call a service to report data
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
  }
}

export const hardwareMonitoringService = HardwareMonitoringService.getInstance();
