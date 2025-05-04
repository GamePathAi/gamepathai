
import { useState, useEffect, useCallback } from "react";
import { usePermissions } from "@/contexts/PermissionsContext";
import { useTranslation } from "react-i18next";
import { hardwareMonitoringService } from "@/services/hardware/hardwareMonitoringService";
import { HardwareData } from "@/types/metrics";
import { hardwareMonitoringUtils } from "@/utils/hardwareMonitoringUtils";

interface HardwareMonitoringOptions {
  interval?: number;
  onError?: (error: Error) => void;
  reportToCloud?: boolean;
  enableAnalysis?: boolean;
}

export const useHardwareMonitoring = (options: HardwareMonitoringOptions = {}) => {
  const { hasPermission, requestPermission } = usePermissions();
  const { t } = useTranslation();
  
  const [data, setData] = useState<HardwareData | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [analysis, setAnalysis] = useState<{
    issues: Array<{ component: string; issue: string; severity: 'warning' | 'critical' | 'info' }>;
    suggestions: string[];
  } | null>(null);
  const [performanceScore, setPerformanceScore] = useState<{
    score: number;
    category: 'excellent' | 'good' | 'fair' | 'poor';
    bottlenecks: string[];
  } | null>(null);
  
  const defaultOptions = {
    interval: 2000, // 2 seconds
    reportToCloud: false,
    enableAnalysis: true,
    ...options
  };
  
  // Function to handle errors
  const handleError = useCallback((err: Error) => {
    setError(err);
    if (options.onError) options.onError(err);
  }, [options]);
  
  // Function to handle data updates with analysis
  const handleDataUpdate = useCallback((newData: HardwareData) => {
    setData(newData);
    
    // Perform analysis if enabled
    if (defaultOptions.enableAnalysis) {
      const newAnalysis = hardwareMonitoringUtils.analyzeHardwareData(newData);
      setAnalysis(newAnalysis);
      
      // Show notification for critical issues
      hardwareMonitoringUtils.notifyAboutIssues(newAnalysis.issues);
      
      // Calculate performance score
      const score = calculatePerformanceScore(newData);
      setPerformanceScore(score);
    }
  }, [defaultOptions.enableAnalysis]);
  
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
  
  // Generate performance report
  const generatePerformanceReport = useCallback(() => {
    if (!data) return "";
    return hardwareMonitoringUtils.createPerformanceReport(data);
  }, [data]);
  
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
    analysis,
    performanceScore,
    startMonitoring,
    stopMonitoring,
    generatePerformanceReport
  };
};

// Import the calculatePerformanceScore function from utils
import { calculatePerformanceScore } from "@/utils/hardwareMonitoringUtils";
