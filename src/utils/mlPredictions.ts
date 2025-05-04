
import { HardwareData } from "@/types/metrics";
import { PerformanceHistoryPoint } from "@/types/history";

/**
 * Simple ML predictions module for hardware performance
 * In a real-world application, this would be more sophisticated with actual ML models
 */
export const mlPredictions = {
  /**
   * Predicts the future performance based on historical data
   */
  predictPerformanceTrend(
    historyPoints: PerformanceHistoryPoint[],
    hoursAhead: number = 24
  ): { 
    cpuUsage: number;
    cpuTemp: number | null;
    gpuUsage: number | null;
    gpuTemp: number | null;
    memoryUsage: number;
    performanceScore: number;
    confidence: number;
  } {
    if (historyPoints.length < 5) {
      // Not enough data for prediction
      return {
        cpuUsage: 0,
        cpuTemp: null,
        gpuUsage: null,
        gpuTemp: null,
        memoryUsage: 0,
        performanceScore: 0,
        confidence: 0
      };
    }
    
    // For this simplified example, we'll use linear regression on recent points
    const recentPoints = historyPoints.slice(-Math.min(50, historyPoints.length));
    
    // Calculate trend for CPU usage
    const cpuTrend = this.calculateLinearTrend(
      recentPoints.map(p => p.cpu.usage)
    );
    
    // Calculate trend for CPU temperature
    let cpuTempTrend = { slope: 0, intercept: 0, r2: 0 };
    const cpuTempPoints = recentPoints.filter(p => p.cpu.temperature !== undefined);
    if (cpuTempPoints.length >= 5) {
      cpuTempTrend = this.calculateLinearTrend(
        cpuTempPoints.map(p => p.cpu.temperature!)
      );
    }
    
    // Calculate trend for Memory usage
    const memoryTrend = this.calculateLinearTrend(
      recentPoints.map(p => p.memory.usage)
    );
    
    // Calculate trend for performance score
    const scoreTrend = this.calculateLinearTrend(
      recentPoints.map(p => p.performanceScore)
    );
    
    // Calculate GPU trends if available
    let gpuTrend = { slope: 0, intercept: 0, r2: 0 };
    let gpuTempTrend = { slope: 0, intercept: 0, r2: 0 };
    
    const gpuPoints = recentPoints.filter(p => p.gpu !== undefined);
    if (gpuPoints.length >= 5) {
      gpuTrend = this.calculateLinearTrend(
        gpuPoints.map(p => p.gpu!.usage)
      );
      
      const gpuTempPoints = gpuPoints.filter(p => p.gpu!.temperature !== undefined);
      if (gpuTempPoints.length >= 5) {
        gpuTempTrend = this.calculateLinearTrend(
          gpuTempPoints.map(p => p.gpu!.temperature!)
        );
      }
    }
    
    // Predict values using the trends
    const timeUnits = hoursAhead / 24 * recentPoints.length;
    
    const predictedCpuUsage = Math.max(0, Math.min(100, 
      cpuTrend.intercept + cpuTrend.slope * timeUnits
    ));
    
    const predictedCpuTemp = cpuTempPoints.length >= 5 ? Math.max(20, Math.min(100,
      cpuTempTrend.intercept + cpuTempTrend.slope * timeUnits
    )) : null;
    
    const predictedMemoryUsage = Math.max(0, Math.min(100,
      memoryTrend.intercept + memoryTrend.slope * timeUnits
    ));
    
    const predictedGpuUsage = gpuPoints.length >= 5 ? Math.max(0, Math.min(100,
      gpuTrend.intercept + gpuTrend.slope * timeUnits
    )) : null;
    
    const predictedGpuTemp = gpuPoints.length >= 5 && gpuTempTrend.r2 > 0 ? Math.max(20, Math.min(100,
      gpuTempTrend.intercept + gpuTempTrend.slope * timeUnits
    )) : null;
    
    const predictedScore = Math.max(0, Math.min(100,
      scoreTrend.intercept + scoreTrend.slope * timeUnits
    ));
    
    // Calculate confidence based on R² values
    const r2Values = [cpuTrend.r2, memoryTrend.r2, scoreTrend.r2];
    if (cpuTempPoints.length >= 5) r2Values.push(cpuTempTrend.r2);
    if (gpuPoints.length >= 5) r2Values.push(gpuTrend.r2);
    if (gpuPoints.length >= 5 && gpuTempTrend.r2 > 0) r2Values.push(gpuTempTrend.r2);
    
    const avgR2 = r2Values.reduce((sum, val) => sum + val, 0) / r2Values.length;
    const confidence = Math.max(0, Math.min(100, avgR2 * 100));
    
    return {
      cpuUsage: Math.round(predictedCpuUsage),
      cpuTemp: predictedCpuTemp !== null ? Math.round(predictedCpuTemp) : null,
      gpuUsage: predictedGpuUsage !== null ? Math.round(predictedGpuUsage) : null,
      gpuTemp: predictedGpuTemp !== null ? Math.round(predictedGpuTemp) : null,
      memoryUsage: Math.round(predictedMemoryUsage),
      performanceScore: Math.round(predictedScore),
      confidence: Math.round(confidence)
    };
  },
  
  /**
   * Predicts potential bottlenecks based on hardware data
   */
  predictBottlenecks(
    currentData: HardwareData,
    historyPoints?: PerformanceHistoryPoint[]
  ): Array<{
    component: string;
    likelihood: number;
    timeFrame: string;
    suggestion: string;
  }> {
    const bottlenecks = [];
    
    // CPU bottleneck analysis
    if (currentData.cpu.usage > 85) {
      bottlenecks.push({
        component: 'CPU',
        likelihood: 95,
        timeFrame: 'Current',
        suggestion: 'Your CPU is currently the main bottleneck. Consider closing background applications or upgrading.'
      });
    } else if (currentData.cpu.usage > 70) {
      bottlenecks.push({
        component: 'CPU',
        likelihood: 70,
        timeFrame: 'Soon',
        suggestion: 'CPU usage is high but not critical. Monitor for further increases.'
      });
    }
    
    // Temperature-based bottleneck
    if (currentData.cpu.temperature && currentData.cpu.temperature > 85) {
      bottlenecks.push({
        component: 'CPU Temperature',
        likelihood: 90,
        timeFrame: 'Immediate',
        suggestion: 'High CPU temperature may cause thermal throttling. Improve cooling.'
      });
    }
    
    // Memory bottleneck
    if (currentData.memory.usage > 90) {
      bottlenecks.push({
        component: 'Memory',
        likelihood: 95,
        timeFrame: 'Current',
        suggestion: 'RAM usage is very high. Close unnecessary applications or add more memory.'
      });
    } else if (currentData.memory.usage > 80) {
      bottlenecks.push({
        component: 'Memory',
        likelihood: 65,
        timeFrame: 'Soon',
        suggestion: 'Memory usage is approaching critical levels. Monitor for further increases.'
      });
    }
    
    // GPU bottleneck if available
    if (currentData.gpu) {
      if (currentData.gpu.usage > 95) {
        bottlenecks.push({
          component: 'GPU',
          likelihood: 95,
          timeFrame: 'Current',
          suggestion: 'GPU is at maximum capacity. Lower graphics settings or consider upgrading.'
        });
      } else if (currentData.gpu.usage > 85) {
        bottlenecks.push({
          component: 'GPU',
          likelihood: 75,
          timeFrame: 'Soon',
          suggestion: 'GPU usage is high. Consider lowering graphics settings for demanding games.'
        });
      }
      
      if (currentData.gpu.temperature && currentData.gpu.temperature > 85) {
        bottlenecks.push({
          component: 'GPU Temperature',
          likelihood: 85,
          timeFrame: 'Immediate',
          suggestion: 'GPU temperature is high. Check cooling and case airflow.'
        });
      }
    }
    
    // If we have history data, look for trends to predict future bottlenecks
    if (historyPoints && historyPoints.length > 10) {
      // Example: Check if memory usage is consistently increasing over time
      const memoryTrend = this.calculateLinearTrend(
        historyPoints.slice(-10).map(p => p.memory.usage)
      );
      
      if (memoryTrend.slope > 0.5 && currentData.memory.usage > 60) {
        bottlenecks.push({
          component: 'Memory (Predicted)',
          likelihood: Math.min(90, Math.round(60 + memoryTrend.slope * 20)),
          timeFrame: 'Future',
          suggestion: 'Memory usage is trending upward. Consider adding more RAM in the future.'
        });
      }
      
      // CPU trend analysis
      const cpuTrend = this.calculateLinearTrend(
        historyPoints.slice(-10).map(p => p.cpu.usage)
      );
      
      if (cpuTrend.slope > 0.5 && currentData.cpu.usage > 50) {
        bottlenecks.push({
          component: 'CPU (Predicted)',
          likelihood: Math.min(90, Math.round(50 + cpuTrend.slope * 20)),
          timeFrame: 'Future',
          suggestion: 'CPU usage is trending upward. Consider an upgrade in the future.'
        });
      }
    }
    
    return bottlenecks;
  },
  
  /**
   * Calculates a linear trend from a series of values
   */
  calculateLinearTrend(values: number[]): { slope: number; intercept: number; r2: number } {
    const n = values.length;
    
    if (n <= 1) {
      return { slope: 0, intercept: values[0] || 0, r2: 0 };
    }
    
    const indices = Array.from({ length: n }, (_, i) => i);
    
    // Calculate means
    const meanX = indices.reduce((sum, x) => sum + x, 0) / n;
    const meanY = values.reduce((sum, y) => sum + y, 0) / n;
    
    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (indices[i] - meanX) * (values[i] - meanY);
      denominator += (indices[i] - meanX) * (indices[i] - meanX);
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;
    
    // Calculate R-squared (coefficient of determination)
    let totalSS = 0;
    let residualSS = 0;
    
    for (let i = 0; i < n; i++) {
      const predicted = intercept + slope * indices[i];
      totalSS += Math.pow(values[i] - meanY, 2);
      residualSS += Math.pow(values[i] - predicted, 2);
    }
    
    const r2 = totalSS !== 0 ? 1 - (residualSS / totalSS) : 0;
    
    return { slope, intercept, r2 };
  }
};
