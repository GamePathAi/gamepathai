
import { HardwareData } from "@/types/metrics";

/**
 * Configuration options for prediction operations
 */
export interface PredictionConfig {
  gameId?: string;
  confidence?: number;
  useCachedResults?: boolean;
  includeExplanations?: boolean;
}

/**
 * Result of a prediction operation
 */
export interface PredictionResult {
  predictions: Record<string, number>;
  confidence: number;
  explanations?: string[];
  timestamp: number;
}
