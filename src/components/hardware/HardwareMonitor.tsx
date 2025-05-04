
import React, { useEffect, useState } from "react";
import { useHardwareMonitoring } from "@/hooks/useHardwareMonitoring";
import { usePermissions } from "@/contexts/PermissionsContext";
import PermissionGate from "@/components/permissions/PermissionGate";
import { useTranslation } from "react-i18next";
import { formatTemperature, formatMemory } from "./hardwareUtils";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Clock, Activity } from "lucide-react";

// Import the components
import MonitoringControls from "./MonitoringControls";
import CpuCard from "./CpuCard";
import MemoryCard from "./MemoryCard";
import GpuCard from "./GpuCard";
import { PerformanceHistory } from "./PerformanceHistory";

interface HardwareMonitorProps {
  showControls?: boolean;
  autoStart?: boolean;
  className?: string;
  showAnalysis?: boolean;
  showHistory?: boolean;
  gameContext?: string;
}

const HardwareMonitor: React.FC<HardwareMonitorProps> = ({
  showControls = true,
  autoStart = true,
  className = "",
  showAnalysis = false,
  showHistory = false,
  gameContext
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("current");
  
  const { 
    data, 
    isMonitoring, 
    startMonitoring, 
    stopMonitoring,
    analysis,
    performanceScore,
    historicalAnalysis
  } = useHardwareMonitoring({
    interval: 2000,
    reportToCloud: false,
    enableAnalysis: showAnalysis,
    recordHistory: true,
    gameContext
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
        
        {showAnalysis && performanceScore && (
          <div className="flex items-center justify-between mb-2 bg-cyber-darkblue/50 p-3 rounded-md border border-cyber-blue/30">
            <div>
              <div className="text-sm">Performance Score</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-tech">
                  {performanceScore.score}
                </span>
                <Badge 
                  className={`
                    ${performanceScore.category === 'excellent' ? 'bg-green-500' : 
                      performanceScore.category === 'good' ? 'bg-blue-500' : 
                      performanceScore.category === 'fair' ? 'bg-amber-500' : 'bg-red-500'} 
                    text-black
                  `}
                >
                  {performanceScore.category}
                </Badge>
              </div>
            </div>
            
            <div className="text-sm">
              {performanceScore.bottlenecks.length > 0 && (
                <div className="flex items-start gap-1">
                  <AlertTriangle size={16} className="text-amber-500 mt-0.5" />
                  <div>
                    <div className="text-amber-500 font-semibold">Bottlenecks:</div>
                    <ul className="list-disc list-inside text-xs">
                      {performanceScore.bottlenecks.slice(0, 2).map((bottleneck, i) => (
                        <li key={i}>{bottleneck}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {showHistory ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-cyber-darkblue border border-cyber-blue/20 mb-3">
              <TabsTrigger value="current" className="font-tech data-[state=active]:bg-cyber-blue/20 data-[state=active]:text-cyber-blue">
                <Activity size={16} className="mr-2" />
                Current Status
              </TabsTrigger>
              <TabsTrigger value="history" className="font-tech data-[state=active]:bg-cyber-purple/20 data-[state=active]:text-cyber-purple">
                <Clock size={16} className="mr-2" />
                Performance History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="current" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CpuCard data={data} formatTemperature={formatTemp} />
                <MemoryCard data={data} formatMemory={formatMem} />
                <GpuCard 
                  data={data} 
                  formatTemperature={formatTemp}
                  formatMemory={formatMem}
                />
              </div>
              
              {showAnalysis && analysis && analysis.issues.length > 0 && (
                <div className="mt-4 bg-cyber-darkblue/50 p-3 rounded-md border border-cyber-orange/30">
                  <h3 className="text-sm font-tech mb-2">{t("hardware.issuesDetected")}</h3>
                  <div className="space-y-2">
                    {analysis.issues.map((issue, index) => (
                      <div 
                        key={index} 
                        className={`p-2 rounded text-sm ${
                          issue.severity === 'critical' ? 'bg-red-500/20 border border-red-500/40' : 
                          issue.severity === 'warning' ? 'bg-amber-500/20 border border-amber-500/40' : 
                          'bg-blue-500/20 border border-blue-500/40'
                        }`}
                      >
                        <div className="font-semibold">{issue.component}</div>
                        <div>{issue.issue}</div>
                      </div>
                    ))}
                  </div>
                  
                  {analysis.suggestions.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-tech mb-1">{t("hardware.suggestions")}</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {analysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-gray-300">{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="mt-0">
              <PerformanceHistory gameFilter={gameContext} />
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CpuCard data={data} formatTemperature={formatTemp} />
              <MemoryCard data={data} formatMemory={formatMem} />
              <GpuCard 
                data={data} 
                formatTemperature={formatTemp}
                formatMemory={formatMem}
              />
            </div>
            
            {showAnalysis && analysis && analysis.issues.length > 0 && (
              <div className="mt-4 bg-cyber-darkblue/50 p-3 rounded-md border border-cyber-orange/30">
                <h3 className="text-sm font-tech mb-2">{t("hardware.issuesDetected")}</h3>
                <div className="space-y-2">
                  {analysis.issues.map((issue, index) => (
                    <div 
                      key={index} 
                      className={`p-2 rounded text-sm ${
                        issue.severity === 'critical' ? 'bg-red-500/20 border border-red-500/40' : 
                        issue.severity === 'warning' ? 'bg-amber-500/20 border border-amber-500/40' : 
                        'bg-blue-500/20 border border-blue-500/40'
                      }`}
                    >
                      <div className="font-semibold">{issue.component}</div>
                      <div>{issue.issue}</div>
                    </div>
                  ))}
                </div>
                
                {analysis.suggestions.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-tech mb-1">{t("hardware.suggestions")}</h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {analysis.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-gray-300">{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PermissionGate>
  );
};

export default HardwareMonitor;
