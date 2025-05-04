
import { HardwareData } from "@/types/metrics";
import { toast } from "sonner";

/**
 * Utilities for hardware monitoring operations
 */
export const hardwareMonitoringUtils = {
  /**
   * Analyzes hardware data to detect potential issues
   */
  analyzeHardwareData(data: HardwareData): { 
    issues: Array<{ component: string; issue: string; severity: 'warning' | 'critical' | 'info' }>;
    suggestions: string[];
  } {
    const issues: Array<{ component: string; issue: string; severity: 'warning' | 'critical' | 'info' }> = [];
    const suggestions: string[] = [];
    
    // Check CPU usage
    if (data.cpu.usage > 90) {
      issues.push({
        component: 'CPU',
        issue: 'Extremely high CPU usage detected',
        severity: 'critical'
      });
      suggestions.push('Close background applications to reduce CPU load');
      suggestions.push('Check for processes that might be using excessive CPU resources');
    } else if (data.cpu.usage > 75) {
      issues.push({
        component: 'CPU',
        issue: 'High CPU usage detected',
        severity: 'warning'
      });
      suggestions.push('Consider limiting background applications while gaming');
    }
    
    // Check CPU temperature
    if (data.cpu.temperature && data.cpu.temperature > 85) {
      issues.push({
        component: 'CPU',
        issue: 'CPU temperature is critically high',
        severity: 'critical'
      });
      suggestions.push('Check CPU cooling system');
      suggestions.push('Ensure proper airflow in your case');
    } else if (data.cpu.temperature && data.cpu.temperature > 75) {
      issues.push({
        component: 'CPU',
        issue: 'CPU temperature is high',
        severity: 'warning'
      });
      suggestions.push('Monitor CPU temperature during intense gaming sessions');
    }
    
    // Check memory usage
    if (data.memory.usage > 90) {
      issues.push({
        component: 'Memory',
        issue: 'Memory usage is very high',
        severity: 'warning'
      });
      suggestions.push('Close unnecessary applications to free up memory');
    }
    
    // Check GPU if available
    if (data.gpu) {
      if (data.gpu.usage > 95) {
        issues.push({
          component: 'GPU',
          issue: 'GPU is running at maximum capacity',
          severity: 'warning'
        });
        suggestions.push('Consider lowering graphics settings in games');
      }
      
      if (data.gpu.temperature && data.gpu.temperature > 85) {
        issues.push({
          component: 'GPU',
          issue: 'GPU temperature is critically high',
          severity: 'critical'
        });
        suggestions.push('Check GPU fans and cooling system');
        suggestions.push('Ensure adequate airflow in your case');
      } else if (data.gpu.temperature && data.gpu.temperature > 80) {
        issues.push({
          component: 'GPU',
          issue: 'GPU temperature is high',
          severity: 'warning'
        });
        suggestions.push('Monitor GPU temperature during gaming sessions');
      }
    }
    
    return { issues, suggestions };
  },
  
  /**
   * Notifies user about detected hardware issues
   */
  notifyAboutIssues(issues: Array<{ component: string; issue: string; severity: 'warning' | 'critical' | 'info' }>): void {
    // Only notify about the most critical issue to avoid spamming
    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    const warningIssues = issues.filter(issue => issue.severity === 'warning');
    
    if (criticalIssues.length > 0) {
      const issue = criticalIssues[0];
      toast.error(`${issue.component} issue detected`, {
        description: issue.issue,
        duration: 6000
      });
    } else if (warningIssues.length > 0) {
      const issue = warningIssues[0];
      toast.warning(`${issue.component} warning`, {
        description: issue.issue,
        duration: 4000
      });
    }
  },
  
  /**
   * Creates a performance report based on hardware data
   */
  createPerformanceReport(data: HardwareData): string {
    const report = [];
    
    report.push(`## Hardware Performance Report`);
    report.push(`Generated: ${new Date().toLocaleString()}`);
    report.push(`\n### CPU`);
    report.push(`- Usage: ${data.cpu.usage.toFixed(1)}%`);
    if (data.cpu.temperature) {
      report.push(`- Temperature: ${data.cpu.temperature.toFixed(1)}°C`);
    }
    if (data.cpu.cores) {
      report.push(`- Cores: ${data.cpu.cores.length}`);
      const avgCoreUsage = data.cpu.cores.reduce((sum, usage) => sum + usage, 0) / data.cpu.cores.length;
      report.push(`- Average core usage: ${avgCoreUsage.toFixed(1)}%`);
    }
    
    report.push(`\n### Memory`);
    report.push(`- Total: ${(data.memory.total / (1024 * 1024)).toFixed(2)} GB`);
    report.push(`- Used: ${(data.memory.used / (1024 * 1024)).toFixed(2)} GB (${data.memory.usage.toFixed(1)}%)`);
    report.push(`- Free: ${(data.memory.free / (1024 * 1024)).toFixed(2)} GB`);
    
    if (data.gpu) {
      report.push(`\n### GPU`);
      report.push(`- Usage: ${data.gpu.usage.toFixed(1)}%`);
      if (data.gpu.temperature) {
        report.push(`- Temperature: ${data.gpu.temperature.toFixed(1)}°C`);
      }
      if (data.gpu.memoryTotal && data.gpu.memoryUsed) {
        report.push(`- VRAM: ${(data.gpu.memoryUsed / (1024 * 1024)).toFixed(2)} GB / ${(data.gpu.memoryTotal / (1024 * 1024)).toFixed(2)} GB`);
        const memoryUsagePercent = (data.gpu.memoryUsed / data.gpu.memoryTotal) * 100;
        report.push(`- VRAM Usage: ${memoryUsagePercent.toFixed(1)}%`);
      }
    }
    
    return report.join('\n');
  }
};

/**
 * Calculates a system performance score based on hardware metrics
 * Returns a score from 0-100 and a category description
 */
export const calculatePerformanceScore = (data: HardwareData): { 
  score: number; 
  category: 'excellent' | 'good' | 'fair' | 'poor';
  bottlenecks: string[];
} => {
  let cpuScore = 100 - data.cpu.usage;
  let memoryScore = 100 - data.memory.usage;
  let gpuScore = data.gpu ? (100 - data.gpu.usage) : 100;
  
  // Temperature penalties
  if (data.cpu.temperature) {
    if (data.cpu.temperature > 85) cpuScore *= 0.7;
    else if (data.cpu.temperature > 75) cpuScore *= 0.85;
  }
  
  if (data.gpu?.temperature) {
    if (data.gpu.temperature > 85) gpuScore *= 0.7;
    else if (data.gpu.temperature > 80) gpuScore *= 0.85;
  }
  
  // Calculate final score (weighted average)
  const finalScore = Math.round((cpuScore * 0.4) + (memoryScore * 0.3) + (gpuScore * 0.3));
  
  // Determine bottlenecks
  const bottlenecks: string[] = [];
  
  if (cpuScore < 50) bottlenecks.push('CPU is heavily loaded');
  if (memoryScore < 40) bottlenecks.push('Memory usage is very high');
  if (gpuScore < 50 && data.gpu) bottlenecks.push('GPU is heavily loaded');
  
  if (data.cpu.temperature && data.cpu.temperature > 80) {
    bottlenecks.push('CPU temperature is concerning');
  }
  
  if (data.gpu?.temperature && data.gpu.temperature > 80) {
    bottlenecks.push('GPU temperature is concerning');
  }
  
  // Determine category
  let category: 'excellent' | 'good' | 'fair' | 'poor';
  if (finalScore >= 85) category = 'excellent';
  else if (finalScore >= 70) category = 'good';
  else if (finalScore >= 50) category = 'fair';
  else category = 'poor';
  
  return { score: finalScore, category, bottlenecks };
};
