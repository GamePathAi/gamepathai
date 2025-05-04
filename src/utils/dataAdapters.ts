
import { MetricData, SystemData, ElectronHardwareData } from "@/types/metrics";

/**
 * Normalizes raw metric data to a standard format
 */
export const normalizeMetricData = (rawData: any): MetricData => {
  // Extract values or provide defaults
  const current = typeof rawData.current === 'number' ? rawData.current : 0;
  const average = typeof rawData.average === 'number' ? rawData.average : current;
  const min = typeof rawData.min === 'number' ? rawData.min : current;
  const max = typeof rawData.max === 'number' ? rawData.max : current;
  
  // Extract or generate trend data
  let trend: "up" | "down" | "stable" = "stable";
  let trendValue = "0%";
  
  if (rawData.trend) {
    trend = rawData.trend;
    trendValue = rawData.trendValue || "0%";
  } else if (rawData.previousAverage && typeof rawData.previousAverage === 'number') {
    const diff = average - rawData.previousAverage;
    const percentage = Math.abs(Math.round((diff / rawData.previousAverage) * 100));
    
    if (diff > 0) {
      trend = "up";
      trendValue = `+${percentage}%`;
    } else if (diff < 0) {
      trend = "down";
      trendValue = `-${percentage}%`;
    }
  }
  
  // Extract or generate history data
  const history = rawData.history && Array.isArray(rawData.history) 
    ? rawData.history 
    : Array.from({ length: 10 }, (_, i) => ({
        time: `${i}m ago`,
        value: Math.round(current + (Math.random() * 10 - 5))
      })).reverse();
  
  return {
    current,
    average,
    min,
    max,
    trend,
    trendValue,
    history
  };
};

/**
 * Normalizes system metrics data to a standard format
 */
export const normalizeSystemData = (rawData: any): SystemData => {
  // Process CPU data
  const cpuData = rawData?.cpu || {};
  const cpuUsage = typeof cpuData.usage === 'number' ? cpuData.usage : Math.round(Math.random() * 60);
  
  // Process GPU data
  const gpuData = rawData?.gpu || {};
  const gpuUsage = typeof gpuData.usage === 'number' ? gpuData.usage : Math.round(Math.random() * 50);
  
  return {
    cpu: {
      usage: cpuUsage,
      temperature: cpuData.temperature,
      trend: cpuData.trend || "stable",
      trendValue: cpuData.trendValue || "0%",
      history: cpuData.history || Array.from({ length: 10 }, (_, i) => ({
        time: `${i}m ago`,
        value: Math.round(cpuUsage + (Math.random() * 10 - 5))
      })).reverse()
    },
    gpu: {
      usage: gpuUsage,
      temperature: gpuData.temperature,
      trend: gpuData.trend || "stable",
      trendValue: gpuData.trendValue || "0%",
      history: gpuData.history || Array.from({ length: 10 }, (_, i) => ({
        time: `${i}m ago`,
        value: Math.round(gpuUsage + (Math.random() * 10 - 5))
      })).reverse()
    }
  };
};

/**
 * Converts Electron hardware data to our standardized format
 */
export const normalizeElectronHardwareData = (data: ElectronHardwareData): ElectronHardwareData => {
  return {
    cpu: {
      usage: typeof data.cpu.usage === 'number' ? data.cpu.usage : 0,
      temperature: data.cpu.temperature,
      cores: data.cpu.cores || []
    },
    memory: {
      total: data.memory.total || 0,
      used: data.memory.used || 0,
      free: data.memory.free || 0,
      usage: typeof data.memory.usage === 'number' ? data.memory.usage : 0
    },
    gpu: data.gpu ? {
      usage: typeof data.gpu.usage === 'number' ? data.gpu.usage : 0,
      temperature: data.gpu.temperature,
      memoryTotal: data.gpu.memoryTotal,
      memoryUsed: data.gpu.memoryUsed
    } : undefined,
    network: data.network,
    disk: data.disk,
    timestamp: data.timestamp || Date.now()
  };
};
