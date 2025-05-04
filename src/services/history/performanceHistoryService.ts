
import { PerformanceHistory, PerformanceHistoryPoint, HistoricalAnalysis } from "@/types/history";
import { HardwareData } from "@/types/metrics";
import { calculatePerformanceScore } from "@/utils/hardwareMonitoringUtils";

class PerformanceHistoryService {
  private static instance: PerformanceHistoryService;
  private history: PerformanceHistory;
  private maxHistoryPoints = 1000; // Maximum number of points to store
  private currentGame: string | null = null;
  
  private constructor() {
    this.history = this.loadFromStorage() || {
      points: [],
      gameSpecific: {},
      startTime: Date.now(),
      endTime: Date.now()
    };
  }
  
  public static getInstance(): PerformanceHistoryService {
    if (!PerformanceHistoryService.instance) {
      PerformanceHistoryService.instance = new PerformanceHistoryService();
    }
    return PerformanceHistoryService.instance;
  }
  
  /**
   * Records a new data point in the history
   */
  public recordDataPoint(hardwareData: HardwareData, game?: string): void {
    const performanceScore = calculatePerformanceScore(hardwareData);
    
    const historyPoint: PerformanceHistoryPoint = {
      timestamp: Date.now(),
      cpu: {
        usage: hardwareData.cpu.usage,
        temperature: hardwareData.cpu.temperature
      },
      memory: {
        usage: hardwareData.memory.usage
      },
      performanceScore: performanceScore.score
    };
    
    if (hardwareData.gpu) {
      historyPoint.gpu = {
        usage: hardwareData.gpu.usage,
        temperature: hardwareData.gpu.temperature
      };
    }
    
    // Add to general history
    this.history.points.push(historyPoint);
    
    // If we have a game context, add to game-specific history
    if (game) {
      if (!this.history.gameSpecific[game]) {
        this.history.gameSpecific[game] = [];
      }
      this.history.gameSpecific[game].push(historyPoint);
      
      // Trim game-specific history if it gets too large
      if (this.history.gameSpecific[game].length > this.maxHistoryPoints) {
        this.history.gameSpecific[game] = this.history.gameSpecific[game].slice(-this.maxHistoryPoints);
      }
    }
    
    // Trim general history if it gets too large
    if (this.history.points.length > this.maxHistoryPoints) {
      this.history.points = this.history.points.slice(-this.maxHistoryPoints);
    }
    
    this.history.endTime = Date.now();
    this.saveToStorage();
  }
  
  /**
   * Sets the current active game
   */
  public setCurrentGame(game: string | null): void {
    this.currentGame = game;
  }
  
  /**
   * Gets the current history
   */
  public getHistory(): PerformanceHistory {
    return this.history;
  }
  
  /**
   * Gets history for a specific game
   */
  public getGameHistory(game: string): PerformanceHistoryPoint[] {
    return this.history.gameSpecific[game] || [];
  }
  
  /**
   * Gets history points for a specific time range
   */
  public getHistoryForTimeRange(
    startTime: number, 
    endTime: number,
    game?: string
  ): PerformanceHistoryPoint[] {
    const points = game ? this.getGameHistory(game) : this.history.points;
    
    return points.filter(point => 
      point.timestamp >= startTime && point.timestamp <= endTime
    );
  }
  
  /**
   * Analyzes the performance history to find trends and anomalies
   */
  public analyzeHistory(timeRange?: { start: number; end: number }, game?: string): HistoricalAnalysis {
    let points = game ? this.getGameHistory(game) : this.history.points;
    
    if (timeRange) {
      points = points.filter(point => 
        point.timestamp >= timeRange.start && point.timestamp <= timeRange.end
      );
    }
    
    if (points.length < 2) {
      return this.createEmptyAnalysis();
    }
    
    // Calculate averages
    const cpuUsageAvg = this.calculateAverage(points.map(p => p.cpu.usage));
    const cpuTempAvg = this.calculateAverage(points.filter(p => p.cpu.temperature !== undefined).map(p => p.cpu.temperature!));
    
    const memoryUsageAvg = this.calculateAverage(points.map(p => p.memory.usage));
    
    let gpuUsageAvg = 0;
    let gpuTempAvg = 0;
    const gpuPoints = points.filter(p => p.gpu !== undefined);
    if (gpuPoints.length > 0) {
      gpuUsageAvg = this.calculateAverage(gpuPoints.map(p => p.gpu!.usage));
      gpuTempAvg = this.calculateAverage(
        gpuPoints.filter(p => p.gpu!.temperature !== undefined).map(p => p.gpu!.temperature!)
      );
    }
    
    const scoreAvg = this.calculateAverage(points.map(p => p.performanceScore));
    
    // Calculate trends by comparing first half with second half
    const midPoint = Math.floor(points.length / 2);
    const firstHalf = points.slice(0, midPoint);
    const secondHalf = points.slice(midPoint);
    
    const cpuUsageTrend = this.calculateTrend(
      this.calculateAverage(firstHalf.map(p => p.cpu.usage)), 
      this.calculateAverage(secondHalf.map(p => p.cpu.usage))
    );
    
    const cpuTempTrend = this.calculateTrend(
      this.calculateAverage(firstHalf.filter(p => p.cpu.temperature !== undefined).map(p => p.cpu.temperature!)), 
      this.calculateAverage(secondHalf.filter(p => p.cpu.temperature !== undefined).map(p => p.cpu.temperature!))
    );
    
    const memoryUsageTrend = this.calculateTrend(
      this.calculateAverage(firstHalf.map(p => p.memory.usage)), 
      this.calculateAverage(secondHalf.map(p => p.memory.usage))
    );
    
    let gpuUsageTrend = 'stable' as 'increasing' | 'decreasing' | 'stable';
    let gpuTempTrend = 'stable' as 'increasing' | 'decreasing' | 'stable';
    
    const firstHalfGpu = firstHalf.filter(p => p.gpu !== undefined);
    const secondHalfGpu = secondHalf.filter(p => p.gpu !== undefined);
    
    if (firstHalfGpu.length > 0 && secondHalfGpu.length > 0) {
      gpuUsageTrend = this.calculateTrend(
        this.calculateAverage(firstHalfGpu.map(p => p.gpu!.usage)), 
        this.calculateAverage(secondHalfGpu.map(p => p.gpu!.usage))
      );
      
      const firstHalfGpuTemp = firstHalfGpu.filter(p => p.gpu!.temperature !== undefined);
      const secondHalfGpuTemp = secondHalfGpu.filter(p => p.gpu!.temperature !== undefined);
      
      if (firstHalfGpuTemp.length > 0 && secondHalfGpuTemp.length > 0) {
        gpuTempTrend = this.calculateTrend(
          this.calculateAverage(firstHalfGpuTemp.map(p => p.gpu!.temperature!)), 
          this.calculateAverage(secondHalfGpuTemp.map(p => p.gpu!.temperature!))
        );
      }
    }
    
    const scoreTrend = this.calculateTrend(
      this.calculateAverage(firstHalf.map(p => p.performanceScore)), 
      this.calculateAverage(secondHalf.map(p => p.performanceScore))
    );
    
    // Find anomalies (points that deviate significantly from the average)
    const anomalies = this.detectAnomalies(points, {
      cpuUsageAvg,
      cpuTempAvg,
      memoryUsageAvg,
      gpuUsageAvg,
      gpuTempAvg,
      scoreAvg
    });
    
    // Generate recommendations based on trends and anomalies
    const recommendations = this.generateRecommendations({
      cpuUsageTrend,
      cpuTempTrend,
      memoryUsageTrend,
      gpuUsageTrend,
      gpuTempTrend,
      scoreTrend,
      anomalies,
      cpuUsageAvg,
      cpuTempAvg,
      memoryUsageAvg,
      gpuUsageAvg,
      gpuTempAvg
    });
    
    return {
      trends: {
        cpu: {
          usageTrend: cpuUsageTrend,
          temperatureTrend: cpuTempTrend,
          usageAverage: cpuUsageAvg,
          temperatureAverage: cpuTempAvg
        },
        memory: {
          usageTrend: memoryUsageTrend,
          usageAverage: memoryUsageAvg
        },
        performanceScoreTrend: scoreTrend,
        performanceScoreAverage: scoreAvg,
        ...(gpuPoints.length > 0 ? {
          gpu: {
            usageTrend: gpuUsageTrend,
            temperatureTrend: gpuTempTrend,
            usageAverage: gpuUsageAvg,
            temperatureAverage: gpuTempAvg
          }
        } : {})
      },
      anomalies,
      recommendations
    };
  }
  
  /**
   * Clears the history
   */
  public clearHistory(): void {
    this.history = {
      points: [],
      gameSpecific: {},
      startTime: Date.now(),
      endTime: Date.now()
    };
    this.saveToStorage();
  }
  
  /**
   * Clears history for a specific game
   */
  public clearGameHistory(game: string): void {
    if (this.history.gameSpecific[game]) {
      delete this.history.gameSpecific[game];
      this.saveToStorage();
    }
  }
  
  // Private helper methods
  
  private loadFromStorage(): PerformanceHistory | null {
    try {
      const stored = localStorage.getItem('performanceHistory');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load performance history from storage:', error);
      return null;
    }
  }
  
  private saveToStorage(): void {
    try {
      localStorage.setItem('performanceHistory', JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save performance history to storage:', error);
    }
  }
  
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }
  
  private calculateTrend(firstValue: number, secondValue: number): 'increasing' | 'decreasing' | 'stable' {
    const difference = secondValue - firstValue;
    const threshold = 3; // 3% difference threshold
    
    if (difference > threshold) return 'increasing';
    if (difference < -threshold) return 'decreasing';
    return 'stable';
  }
  
  private detectAnomalies(
    points: PerformanceHistoryPoint[], 
    averages: {
      cpuUsageAvg: number;
      cpuTempAvg: number;
      memoryUsageAvg: number;
      gpuUsageAvg: number;
      gpuTempAvg: number;
      scoreAvg: number;
    }
  ): Array<{
    component: string;
    metric: string;
    value: number;
    expected: number;
    timestamp: number;
    severity: 'low' | 'medium' | 'high';
  }> {
    const anomalies = [];
    
    // Threshold percentages for determining anomalies
    const thresholds = {
      low: 15, // 15% deviation
      medium: 25, // 25% deviation
      high: 40 // 40% deviation
    };
    
    for (const point of points) {
      // Check CPU usage anomalies
      const cpuUsageDeviation = Math.abs(point.cpu.usage - averages.cpuUsageAvg) / averages.cpuUsageAvg * 100;
      if (cpuUsageDeviation > thresholds.low) {
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (cpuUsageDeviation > thresholds.high) severity = 'high';
        else if (cpuUsageDeviation > thresholds.medium) severity = 'medium';
        
        anomalies.push({
          component: 'CPU',
          metric: 'usage',
          value: point.cpu.usage,
          expected: averages.cpuUsageAvg,
          timestamp: point.timestamp,
          severity
        });
      }
      
      // Check CPU temperature anomalies
      if (point.cpu.temperature !== undefined && averages.cpuTempAvg > 0) {
        const cpuTempDeviation = Math.abs(point.cpu.temperature - averages.cpuTempAvg) / averages.cpuTempAvg * 100;
        if (cpuTempDeviation > thresholds.low) {
          let severity: 'low' | 'medium' | 'high' = 'low';
          if (cpuTempDeviation > thresholds.high) severity = 'high';
          else if (cpuTempDeviation > thresholds.medium) severity = 'medium';
          
          anomalies.push({
            component: 'CPU',
            metric: 'temperature',
            value: point.cpu.temperature,
            expected: averages.cpuTempAvg,
            timestamp: point.timestamp,
            severity
          });
        }
      }
      
      // Check Memory usage anomalies
      const memUsageDeviation = Math.abs(point.memory.usage - averages.memoryUsageAvg) / averages.memoryUsageAvg * 100;
      if (memUsageDeviation > thresholds.low) {
        let severity: 'low' | 'medium' | 'high' = 'low';
        if (memUsageDeviation > thresholds.high) severity = 'high';
        else if (memUsageDeviation > thresholds.medium) severity = 'medium';
        
        anomalies.push({
          component: 'Memory',
          metric: 'usage',
          value: point.memory.usage,
          expected: averages.memoryUsageAvg,
          timestamp: point.timestamp,
          severity
        });
      }
      
      // Check GPU anomalies if available
      if (point.gpu && averages.gpuUsageAvg > 0) {
        const gpuUsageDeviation = Math.abs(point.gpu.usage - averages.gpuUsageAvg) / averages.gpuUsageAvg * 100;
        if (gpuUsageDeviation > thresholds.low) {
          let severity: 'low' | 'medium' | 'high' = 'low';
          if (gpuUsageDeviation > thresholds.high) severity = 'high';
          else if (gpuUsageDeviation > thresholds.medium) severity = 'medium';
          
          anomalies.push({
            component: 'GPU',
            metric: 'usage',
            value: point.gpu.usage,
            expected: averages.gpuUsageAvg,
            timestamp: point.timestamp,
            severity
          });
        }
        
        if (point.gpu.temperature !== undefined && averages.gpuTempAvg > 0) {
          const gpuTempDeviation = Math.abs(point.gpu.temperature - averages.gpuTempAvg) / averages.gpuTempAvg * 100;
          if (gpuTempDeviation > thresholds.low) {
            let severity: 'low' | 'medium' | 'high' = 'low';
            if (gpuTempDeviation > thresholds.high) severity = 'high';
            else if (gpuTempDeviation > thresholds.medium) severity = 'medium';
            
            anomalies.push({
              component: 'GPU',
              metric: 'temperature',
              value: point.gpu.temperature,
              expected: averages.gpuTempAvg,
              timestamp: point.timestamp,
              severity
            });
          }
        }
      }
      
      // Check performance score anomalies
      const scoreDeviation = Math.abs(point.performanceScore - averages.scoreAvg) / averages.scoreAvg * 100;
      if (scoreDeviation > thresholds.medium) { // Higher threshold for performance score
        let severity: 'low' | 'medium' | 'high' = 'medium';
        if (scoreDeviation > thresholds.high) severity = 'high';
        
        anomalies.push({
          component: 'System',
          metric: 'performanceScore',
          value: point.performanceScore,
          expected: averages.scoreAvg,
          timestamp: point.timestamp,
          severity
        });
      }
    }
    
    return anomalies;
  }
  
  private generateRecommendations(data: {
    cpuUsageTrend: 'increasing' | 'decreasing' | 'stable';
    cpuTempTrend: 'increasing' | 'decreasing' | 'stable';
    memoryUsageTrend: 'increasing' | 'decreasing' | 'stable';
    gpuUsageTrend: 'increasing' | 'decreasing' | 'stable';
    gpuTempTrend: 'increasing' | 'decreasing' | 'stable';
    scoreTrend: 'increasing' | 'decreasing' | 'stable';
    anomalies: Array<any>;
    cpuUsageAvg: number;
    cpuTempAvg: number;
    memoryUsageAvg: number;
    gpuUsageAvg: number;
    gpuTempAvg: number;
  }): string[] {
    const recommendations: string[] = [];
    
    // CPU recommendations
    if (data.cpuTempTrend === 'increasing' && data.cpuTempAvg > 75) {
      recommendations.push('CPU temperature is trending upward. Consider improving cooling or reducing CPU load.');
    }
    
    if (data.cpuUsageTrend === 'increasing' && data.cpuUsageAvg > 80) {
      recommendations.push('CPU usage is consistently high and increasing. Check for background processes or consider upgrading your CPU.');
    }
    
    // Memory recommendations
    if (data.memoryUsageTrend === 'increasing' && data.memoryUsageAvg > 85) {
      recommendations.push('Memory usage is trending upward and very high. Consider closing unnecessary applications or adding more RAM.');
    } else if (data.memoryUsageAvg > 90) {
      recommendations.push('Memory usage is extremely high. This may cause system instability or performance issues.');
    }
    
    // GPU recommendations
    if (data.gpuTempTrend === 'increasing' && data.gpuTempAvg > 80) {
      recommendations.push('GPU temperature is trending upward and high. Check GPU cooling and airflow in your case.');
    }
    
    if (data.gpuUsageTrend === 'increasing' && data.gpuUsageAvg > 95) {
      recommendations.push('GPU is consistently at maximum capacity. Consider lowering game graphics settings for better performance.');
    }
    
    // Anomaly-based recommendations
    const severeCpuTempAnomalies = data.anomalies.filter(a => 
      a.component === 'CPU' && a.metric === 'temperature' && a.severity === 'high' && a.value > 85
    );
    
    if (severeCpuTempAnomalies.length > 0) {
      recommendations.push('Several instances of critically high CPU temperature detected. Urgent cooling improvements recommended.');
    }
    
    const severeGpuTempAnomalies = data.anomalies.filter(a => 
      a.component === 'GPU' && a.metric === 'temperature' && a.severity === 'high' && a.value > 90
    );
    
    if (severeGpuTempAnomalies.length > 0) {
      recommendations.push('Several instances of critically high GPU temperature detected. Check GPU cooling system immediately.');
    }
    
    // Add general recommendations based on component averages
    if (data.cpuTempAvg > 80) {
      recommendations.push('Average CPU temperature is high. Consider improving CPU cooling solution.');
    }
    
    if (data.gpuTempAvg > 85) {
      recommendations.push('Average GPU temperature is high. Ensure proper case airflow and GPU cooling.');
    }
    
    if (data.memoryUsageAvg > 85) {
      recommendations.push('Memory usage is consistently high. Consider upgrading your RAM or optimizing application memory usage.');
    }
    
    return recommendations;
  }
  
  private createEmptyAnalysis(): HistoricalAnalysis {
    return {
      trends: {
        cpu: {
          usageTrend: 'stable',
          temperatureTrend: 'stable',
          usageAverage: 0,
          temperatureAverage: 0
        },
        memory: {
          usageTrend: 'stable',
          usageAverage: 0
        },
        performanceScoreTrend: 'stable',
        performanceScoreAverage: 0
      },
      anomalies: [],
      recommendations: []
    };
  }
}

export const performanceHistoryService = PerformanceHistoryService.getInstance();
