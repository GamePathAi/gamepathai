
import React, { useEffect } from "react";
import { useHardwareMonitoring } from "@/hooks/useHardwareMonitoring";
import { usePermissions } from "@/contexts/PermissionsContext";
import PermissionGate from "@/components/permissions/PermissionGate";
import { useTranslation } from "react-i18next";
import { formatTemperature, formatMemory } from "./hardwareUtils";

// Import the new components
import MonitoringControls from "./MonitoringControls";
import CpuCard from "./CpuCard";
import MemoryCard from "./MemoryCard";
import GpuCard from "./GpuCard";

interface HardwareMonitorProps {
  showControls?: boolean;
  autoStart?: boolean;
  className?: string;
}

const HardwareMonitor: React.FC<HardwareMonitorProps> = ({
  showControls = true,
  autoStart = true,
  className = ""
}) => {
  const { t } = useTranslation();
  const { data, isMonitoring, startMonitoring, stopMonitoring } = useHardwareMonitoring({
    interval: 2000,
    reportToCloud: false
  });
  
  useEffect(() => {
    if (autoStart && !isMonitoring) {
      startMonitoring();
    }
    
    return () => {
      if (isMonitoring) {
        stopMonitoring();
      }
    };
  }, [autoStart, isMonitoring, startMonitoring, stopMonitoring]);
  
  const formatTemp = (temp?: number) => formatTemperature(temp, t);
  const formatMem = (bytes?: number) => formatMemory(bytes, t);
  
  return (
    <PermissionGate permissionType="hardware_monitoring">
      <div className={`space-y-4 ${className}`}>
        {showControls && (
          <MonitoringControls 
            isMonitoring={isMonitoring}
            startMonitoring={startMonitoring}
            stopMonitoring={stopMonitoring}
          />
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CpuCard data={data} formatTemperature={formatTemp} />
          <MemoryCard data={data} formatMemory={formatMem} />
          <GpuCard 
            data={data} 
            formatTemperature={formatTemp}
            formatMemory={formatMem}
          />
        </div>
      </div>
    </PermissionGate>
  );
};

export default HardwareMonitor;
