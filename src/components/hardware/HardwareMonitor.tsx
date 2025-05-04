
import React, { useEffect } from "react";
import { useHardwareMonitoring } from "@/hooks/useHardwareMonitoring";
import { usePermissions } from "@/contexts/PermissionsContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import PermissionGate from "@/components/permissions/PermissionGate";
import { Cpu, Memory, HardDrive } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  
  const formatTemperature = (temp?: number) => {
    if (temp === undefined) return t("hardware.notAvailable");
    return `${temp.toFixed(1)}°C`;
  };
  
  const formatMemory = (bytes?: number) => {
    if (bytes === undefined) return t("hardware.notAvailable");
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };
  
  return (
    <PermissionGate permissionType="hardware_monitoring">
      <div className={`space-y-4 ${className}`}>
        {showControls && (
          <div className="flex justify-end space-x-2">
            {!isMonitoring ? (
              <Button 
                size="sm"
                onClick={() => startMonitoring()}
                className="bg-cyber-blue hover:bg-cyber-blue/80"
              >
                {t("hardware.startMonitoring")}
              </Button>
            ) : (
              <Button 
                size="sm"
                variant="outline"
                onClick={() => stopMonitoring()}
                className="border-cyber-blue/40 text-cyber-blue"
              >
                {t("hardware.stopMonitoring")}
              </Button>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CPU Card */}
          <Card className="bg-cyber-darkblue/70 border-cyber-blue/30">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-md font-tech text-white flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-cyber-blue" />
                  {t("hardware.cpu")}
                </CardTitle>
                {data && (
                  <span className="text-lg font-bold text-cyber-green">
                    {data.cpu.usage.toFixed(1)}%
                  </span>
                )}
              </div>
              <CardDescription className="text-gray-400">
                {formatTemperature(data?.cpu.temperature)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress 
                value={data?.cpu.usage ?? 0} 
                max={100}
                className="h-2 mt-1"
              />
              
              {data?.cpu.cores && (
                <div className="mt-4">
                  <p className="text-xs text-gray-400 mb-1">{t("hardware.cores")}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {data.cpu.cores.map((usage, index) => (
                      <div key={index} className="space-y-1">
                        <Progress value={usage} max={100} className="h-1" />
                        <span className="text-[10px] text-gray-500">{index + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Memory Card */}
          <Card className="bg-cyber-darkblue/70 border-cyber-blue/30">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-md font-tech text-white flex items-center gap-2">
                  <Memory className="h-4 w-4 text-cyber-blue" />
                  {t("hardware.ram")}
                </CardTitle>
                {data && (
                  <span className="text-lg font-bold text-cyber-green">
                    {data.memory.usage.toFixed(1)}%
                  </span>
                )}
              </div>
              <CardDescription className="text-gray-400">
                {data && `${formatMemory(data.memory.used)} / ${formatMemory(data.memory.total)}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress 
                value={data?.memory.usage ?? 0} 
                max={100}
                className="h-2 mt-1"
              />
              
              {data && (
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="bg-cyber-darkblue/40 p-2 rounded">
                    <p className="text-xs text-gray-400">{t("hardware.total")}</p>
                    <p className="text-sm font-medium">{formatMemory(data.memory.total)}</p>
                  </div>
                  <div className="bg-cyber-darkblue/40 p-2 rounded">
                    <p className="text-xs text-gray-400">{t("hardware.used")}</p>
                    <p className="text-sm font-medium">{formatMemory(data.memory.used)}</p>
                  </div>
                  <div className="bg-cyber-darkblue/40 p-2 rounded">
                    <p className="text-xs text-gray-400">{t("hardware.free")}</p>
                    <p className="text-sm font-medium">{formatMemory(data.memory.free)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* GPU Card */}
          <Card className="bg-cyber-darkblue/70 border-cyber-blue/30">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-md font-tech text-white flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-cyber-blue" />
                  {t("hardware.gpu")}
                </CardTitle>
                {data?.gpu && (
                  <span className="text-lg font-bold text-cyber-green">
                    {data.gpu.usage.toFixed(1)}%
                  </span>
                )}
              </div>
              <CardDescription className="text-gray-400">
                {formatTemperature(data?.gpu?.temperature)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress 
                value={data?.gpu?.usage ?? 0} 
                max={100}
                className="h-2 mt-1"
              />
              
              {data?.gpu && (
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="bg-cyber-darkblue/40 p-2 rounded">
                    <p className="text-xs text-gray-400">{t("hardware.memory")}</p>
                    <p className="text-sm font-medium">
                      {formatMemory(data.gpu.memoryUsed)} / {formatMemory(data.gpu.memoryTotal)}
                    </p>
                  </div>
                  <div className="bg-cyber-darkblue/40 p-2 rounded">
                    <p className="text-xs text-gray-400">{t("hardware.memoryUsage")}</p>
                    <p className="text-sm font-medium">
                      {data.gpu.memoryTotal && data.gpu.memoryUsed
                        ? `${((data.gpu.memoryUsed / data.gpu.memoryTotal) * 100).toFixed(1)}%`
                        : t("hardware.notAvailable")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGate>
  );
};

export default HardwareMonitor;
