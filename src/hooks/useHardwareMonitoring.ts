
import { useState, useEffect, useCallback } from "react";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useTranslation } from "react-i18next";
import { hardwareMonitoringService } from "@/services/hardware/hardwareMonitoringService";
import { HardwareData } from "@/types/metrics";

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
  
  // Function to handle errors
  const handleError = useCallback((err: Error) => {
    setError(err);
    if (options.onError) options.onError(err);
  }, [options]);
  
  // Function to handle data updates
  const handleDataUpdate = useCallback((newData: HardwareData) => {
    setData(newData);
  }, []);
  
  // Function to start monitoring
  const startMonitoring = useCallback(async () => {
    // Check permissions
    const hasPermissionResult = await hardwareMonitoringService.checkPermission(
      hasPermission,
      requestPermission,
      t
    );
    
    if (!hasPermissionResult) {
      return false;
    }
    
    // Start the monitoring
    const cleanup = await hardwareMonitoringService.startMonitoring(
      defaultOptions.interval,
      handleDataUpdate,
      handleError,
      t,
      hasPermission
    );
    
    if (cleanup) {
      setIsMonitoring(true);
      setError(null);
      return cleanup;
    }
    
    return false;
  }, [hasPermission, requestPermission, defaultOptions.interval, handleDataUpdate, handleError, t]);
  
  // Function to stop monitoring
  const stopMonitoring = useCallback(async () => {
    const result = await hardwareMonitoringService.stopMonitoring(handleError);
    
    if (result) {
      setIsMonitoring(false);
    }
    
    return result;
  }, [handleError]);
  
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
