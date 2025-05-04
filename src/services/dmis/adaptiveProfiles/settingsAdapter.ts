
import { HardwareData } from "@/types/metrics";
import { AdaptiveProfile } from "./types";

/**
 * Responsible for adapting settings based on hardware metrics
 */
export class SettingsAdapter {
  /**
   * Apply adaptive settings based on current hardware metrics
   */
  public applyAdaptiveSettings(
    profile: AdaptiveProfile,
    hardwareData: HardwareData
  ): Record<string, any> | null {
    if (!profile || !profile.autoAdjust) {
      return null;
    }
    
    // Start with base settings
    const adaptedSettings = { ...profile.baseSettings };
    
    // Apply adaptive overrides based on hardware metrics
    for (const override of profile.adaptiveOverrides) {
      const { condition, setting, value } = override;
      
      // Extract the actual metric value using the path
      const metricPath = condition.metric.split('.');
      let metricValue: any = hardwareData;
      
      for (const path of metricPath) {
        if (metricValue && metricValue[path] !== undefined) {
          metricValue = metricValue[path];
        } else {
          // Path doesn't exist, skip this override
          metricValue = null;
          break;
        }
      }
      
      if (metricValue === null) continue;
      
      // Apply the condition
      let conditionMet = false;
      switch (condition.operator) {
        case '>': conditionMet = metricValue > condition.value; break;
        case '<': conditionMet = metricValue < condition.value; break;
        case '>=': conditionMet = metricValue >= condition.value; break;
        case '<=': conditionMet = metricValue <= condition.value; break;
        case '=': conditionMet = metricValue === condition.value; break;
      }
      
      if (conditionMet) {
        adaptedSettings[setting] = value;
      }
    }
    
    return adaptedSettings;
  }
}

export const settingsAdapter = new SettingsAdapter();
