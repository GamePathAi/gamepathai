
import { HardwareData } from "./metrics";

export interface PerformanceHistoryPoint {
  timestamp: number;
  cpu: {
    usage: number;
    temperature?: number;
  };
  gpu?: {
    usage: number;
    temperature?: number;
  };
  memory: {
    usage: number;
  };
  performanceScore: number;
}

export interface PerformanceHistory {
  points: PerformanceHistoryPoint[];
  gameSpecific: Record<string, PerformanceHistoryPoint[]>;
  startTime: number;
  endTime: number;
}

export interface HistoricalAnalysis {
  trends: {
    cpu: {
      usageTrend: 'increasing' | 'decreasing' | 'stable';
      temperatureTrend: 'increasing' | 'decreasing' | 'stable';
      usageAverage: number;
      temperatureAverage: number;
    };
    gpu?: {
      usageTrend: 'increasing' | 'decreasing' | 'stable';
      temperatureTrend: 'increasing' | 'decreasing' | 'stable';
      usageAverage: number;
      temperatureAverage: number;
    };
    memory: {
      usageTrend: 'increasing' | 'decreasing' | 'stable';
      usageAverage: number;
    };
    performanceScoreTrend: 'increasing' | 'decreasing' | 'stable';
    performanceScoreAverage: number;
  };
  anomalies: Array<{
    component: string;
    metric: string;
    value: number;
    expected: number;
    timestamp: number;
    severity: 'low' | 'medium' | 'high';
  }>;
  recommendations: string[];
}
