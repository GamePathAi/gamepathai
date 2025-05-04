import React from "react";
import MetricCard from "@/components/MetricCard";
import MetricChart from "@/components/MetricChart";
import { BarChart4, Cpu, Zap, Activity } from "lucide-react";
import { useMetrics } from "@/hooks/useMetrics";
import { SystemData, MetricData, HistoryPoint } from "@/types/metrics";

const SystemMetrics: React.FC = () => {
  const { system, jitter, isLoading } = useMetrics();

  if (isLoading.system) {
    return (
      <div className="h-full system-metrics-container animate-pulse">
        <div className="space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] bg-cyber-darkblue/50 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Safe accessors for potentially undefined values
  const getCpuUsage = (system?: SystemData) => system?.cpu?.usage?.toString() || "0";
  const getCpuTrend = (system?: SystemData) => system?.cpu?.trend || "stable";
  const getCpuTrendValue = (system?: SystemData) => system?.cpu?.trendValue || "0%";
  const getCpuHistory = (system?: SystemData) => system?.cpu?.history || [];
  
  const getGpuUsage = (system?: SystemData) => system?.gpu?.usage?.toString() || "0";
  const getGpuTrend = (system?: SystemData) => system?.gpu?.trend || "stable";
  const getGpuTrendValue = (system?: SystemData) => system?.gpu?.trendValue || "0%";
  const getGpuHistory = (system?: SystemData) => system?.gpu?.history || [];
  
  const getJitterCurrent = (jitter?: MetricData) => jitter?.current?.toString() || "0";
  const getJitterTrend = (jitter?: MetricData) => jitter?.trend || "stable";
  const getJitterTrendValue = (jitter?: MetricData) => jitter?.trendValue || "0ms";
  const getJitterHistory = (jitter?: MetricData) => jitter?.history || [];

  return (
    <div className="h-full system-metrics-container">
      <div className="mb-3 flex items-center">
        <BarChart4 size={18} className="text-cyber-purple mr-2" />
        <h2 className="text-lg font-cyber font-semibold text-white">System Metrics</h2>
      </div>
      
      <div className="space-y-5">
        <MetricCard
          title="CPU USAGE"
          value={getCpuUsage(system)}
          unit=" %"
          trend={getCpuTrend(system)}
          trendValue={getCpuTrendValue(system)}
          icon={<Cpu size={16} className="text-cyber-purple" />}
          chartComponent={
            <MetricChart 
              data={getCpuHistory(system)} 
              color="#8B5CF6" 
              metricType="cpu" 
              height={160}
              showAxis={true}
              strokeWidth={2}
            />
          }
          className="p-3 h-[200px]"
        />
        
        <MetricCard
          title="GPU USAGE"
          value={getGpuUsage(system)}
          unit=" %"
          trend={getGpuTrend(system)}
          trendValue={getGpuTrendValue(system)}
          icon={<Zap size={16} className="text-cyber-pink" />}
          chartComponent={
            <MetricChart 
              data={getGpuHistory(system)} 
              color="#D946EF" 
              metricType="gpu" 
              height={160}
              showAxis={true}
              strokeWidth={2}
            />
          }
          className="p-3 h-[200px]"
        />
        
        <MetricCard
          title="CONNECTION JITTER"
          value={getJitterCurrent(jitter)}
          unit=" ms"
          trend={getJitterTrend(jitter)}
          trendValue={getJitterTrendValue(jitter)}
          icon={<Activity size={16} className="text-cyber-orange" />}
          chartComponent={
            <MetricChart 
              data={getJitterHistory(jitter)} 
              color="#F97316" 
              metricType="jitter" 
              height={160}
              showAxis={true}
              strokeWidth={2}
            />
          }
          className="p-3 h-[200px]"
        />
      </div>
    </div>
  );
};

export default SystemMetrics;
