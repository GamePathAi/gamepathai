
import { HardwareData } from "@/types/metrics";

/**
 * Defines the condition structure for adaptive settings overrides
 */
export interface AdaptiveCondition {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '=';
  value: number;
}

/**
 * Defines an override rule that applies when a condition is met
 */
export interface AdaptiveOverride {
  condition: AdaptiveCondition;
  setting: string;
  value: number;
}

/**
 * Defines the structure of an adaptive game profile
 */
export interface AdaptiveProfile {
  id: string;
  name: string;
  gameId: string;
  hardwareFingerprint: string;
  baseSettings: Record<string, any>;
  adaptiveOverrides: AdaptiveOverride[];
  performance: {
    baseFps: number;
    targetFps: number;
    minFps: number;
  };
  createdAt: number;
  updatedAt: number;
  isActive: boolean;
  autoAdjust: boolean;
  knowledgeSources: string[];
}
