// Export ML API modules
export * from './mlApiClient';
export * from './mlUrlDiagnostics';
export * from './mlService';
export * from './mlDiagnostics';
export * from './types';

// Remove these duplicate interfaces since we're now exporting them from types.ts

export interface MLDetectedGamesResponse {
  detectedGames: {
    id: string;
    name: string;
    type?: string;
  }[];
}

export interface MLOptimizeGameResponse {
  optimizationType?: "network" | "system" | "both";
  improvements?: {
    latency?: number;
    fps?: number;
    stability?: number;
  };
  success: boolean;
}
