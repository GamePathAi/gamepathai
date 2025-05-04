
export interface HistoryPoint {
  time: string;
  value: number;
}

export interface MetricData {
  current: number;
  average: number;
  min: number;
  max: number;
  trend: "up" | "down" | "stable";
  trendValue: string;
  history: HistoryPoint[];
}

export interface SystemData {
  cpu: {
    usage: number;
    temperature?: number;
    trend: "up" | "down" | "stable";
    trendValue: string;
    history: HistoryPoint[];
  };
  gpu: {
    usage: number;
    temperature?: number;
    trend: "up" | "down" | "stable";
    trendValue: string;
    history: HistoryPoint[];
  };
}

export interface NetworkMetrics {
  ping: MetricData;
  jitter: MetricData;
  packetLoss?: MetricData;
  upload?: MetricData;
  download?: MetricData;
}

export interface GameMetrics {
  fps: MetricData;
  frameTime?: MetricData;
}

export interface OptimizationResult {
  beforeMetrics: NetworkMetrics;
  afterMetrics: NetworkMetrics;
  improvementPercentage: number;
  appliedChanges: string[];
  timestamp: Date;
}

export interface ElectronHardwareData {
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
  network?: {
    download: number;
    upload: number;
    interfaces?: Record<string, {
      address: string;
      download: number;
      upload: number;
    }>;
  };
  disk?: {
    total: number;
    used: number;
    free: number;
    usage: number;
    readSpeed?: number;
    writeSpeed?: number;
  };
  timestamp: number;
}
