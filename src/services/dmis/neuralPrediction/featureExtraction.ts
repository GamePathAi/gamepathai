
import { HardwareData } from "@/types/metrics";
import { calculateStdDev } from "./utils";

/**
 * Prepare features vector for game settings prediction
 */
export function prepareGameSettingsFeatures(
  hardwareData: HardwareData, 
  currentSettings: Record<string, any>
): number[] {
  // Extract hardware metrics
  const features: number[] = [
    // CPU metrics
    hardwareData.cpu.usage / 100,
    hardwareData.cpu.temperature ? hardwareData.cpu.temperature / 100 : 0.5,
    
    // GPU metrics
    hardwareData.gpu?.usage ? hardwareData.gpu.usage / 100 : 0.5,
    hardwareData.gpu?.temperature ? hardwareData.gpu.temperature / 100 : 0.5,
    hardwareData.gpu?.memoryUsed && hardwareData.gpu.memoryTotal 
      ? hardwareData.gpu.memoryUsed / hardwareData.gpu.memoryTotal 
      : 0.5,
    
    // Memory metrics
    hardwareData.memory.usage / 100,
    hardwareData.memory.used / hardwareData.memory.total,
    
    // Current settings (normalized to 0-1)
    currentSettings.resolution !== undefined ? currentSettings.resolution : 0.5,
    currentSettings.graphics_quality !== undefined ? currentSettings.graphics_quality : 0.5,
    currentSettings.antialiasing !== undefined ? currentSettings.antialiasing : 0.5,
    currentSettings.shadows !== undefined ? currentSettings.shadows : 0.5,
    currentSettings.textures !== undefined ? currentSettings.textures : 0.5,
    currentSettings.effects !== undefined ? currentSettings.effects : 0.5,
    currentSettings.view_distance !== undefined ? currentSettings.view_distance : 0.5,
    currentSettings.fps_cap !== undefined ? currentSettings.fps_cap : 0.5,
  ];
  
  // Pad to expected length (24) with zeros if needed
  while (features.length < 24) {
    features.push(0);
  }
  
  return features;
}

/**
 * Prepare features vector for bottleneck prediction
 */
export function prepareBottleneckFeatures(hardwareData: HardwareData): number[] {
  // Extract hardware metrics
  const features: number[] = [
    // CPU metrics
    hardwareData.cpu.usage / 100,
    hardwareData.cpu.temperature ? hardwareData.cpu.temperature / 100 : 0.5,
    
    // GPU metrics
    hardwareData.gpu?.usage ? hardwareData.gpu.usage / 100 : 0.5,
    hardwareData.gpu?.temperature ? hardwareData.gpu.temperature / 100 : 0.5,
    hardwareData.gpu?.memoryUsed && hardwareData.gpu.memoryTotal 
      ? hardwareData.gpu.memoryUsed / hardwareData.gpu.memoryTotal 
      : 0.5,
    
    // Memory metrics
    hardwareData.memory.usage / 100,
    hardwareData.memory.used / hardwareData.memory.total,
    
    // Disk metrics - if available
    hardwareData.disk?.usage ? hardwareData.disk.usage / 100 : 0.5,
    hardwareData.disk?.readSpeed ? Math.min(hardwareData.disk.readSpeed / 500, 1) : 0.5,
    hardwareData.disk?.writeSpeed ? Math.min(hardwareData.disk.writeSpeed / 500, 1) : 0.5,
    
    // Core usage distribution (simplified)
    hardwareData.cpu.cores 
      ? Math.max(...hardwareData.cpu.cores) / 100 
      : 0.5,
    hardwareData.cpu.cores 
      ? Math.min(...hardwareData.cpu.cores) / 100 
      : 0.5,
    hardwareData.cpu.cores 
      ? calculateStdDev(hardwareData.cpu.cores) / 50 
      : 0.5,
  ];
  
  // Pad to expected length (16) with zeros if needed
  while (features.length < 16) {
    features.push(0);
  }
  
  return features;
}
