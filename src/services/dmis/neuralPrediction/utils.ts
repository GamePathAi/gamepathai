
/**
 * Calculate standard deviation for a numeric array
 */
export function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Generate explanations for settings predictions
 */
export function generateSettingExplanations(
  predictions: Record<string, number>, 
  hardwareData: any
): string[] {
  const explanations: string[] = [];
  
  // Analyze CPU bottlenecks
  if (hardwareData.cpu.usage > 80) {
    explanations.push(
      "High CPU usage detected. Lowering CPU-intensive settings like physics, AI, and view distance."
    );
  }
  
  // Analyze GPU bottlenecks
  if (hardwareData.gpu?.usage && hardwareData.gpu.usage > 90) {
    explanations.push(
      "GPU is near maximum capacity. Reducing graphics quality and effects to improve performance."
    );
  }
  
  // Analyze memory constraints
  if (hardwareData.memory.usage > 85) {
    explanations.push(
      "System memory is highly utilized. Reducing texture quality to reduce memory pressure."
    );
  }
  
  // Analyze specific settings
  if (predictions.resolution < 0.4) {
    explanations.push(
      "Lower resolution recommended for better performance on your hardware."
    );
  }
  
  if (predictions.shadows < 0.3) {
    explanations.push(
      "Reduced shadow quality recommended to improve performance."
    );
  }
  
  return explanations;
}

/**
 * Generate explanations for bottleneck predictions
 */
export function generateBottleneckExplanations(
  predictions: Record<string, number>, 
  hardwareData: any
): string[] {
  const explanations: string[] = [];
  
  // Identify the primary bottleneck
  const bottlenecks = Object.entries(predictions).sort((a, b) => b[1] - a[1]);
  const primaryBottleneck = bottlenecks[0];
  
  if (primaryBottleneck[1] > 0.7) {
    switch (primaryBottleneck[0]) {
      case "cpu":
        explanations.push(
          "CPU is the main performance bottleneck. Consider reducing physics, AI complexity, and view distances."
        );
        
        if (hardwareData.cpu.usage > 90) {
          explanations.push(
            "CPU usage is extremely high. Check for background processes that might be consuming resources."
          );
        }
        break;
        
      case "gpu":
        explanations.push(
          "GPU is the main performance bottleneck. Consider lowering resolution, shadows, and effects."
        );
        
        if (hardwareData.gpu?.memoryUsed && hardwareData.gpu.memoryTotal && 
            (hardwareData.gpu.memoryUsed / hardwareData.gpu.memoryTotal > 0.9)) {
          explanations.push(
            "GPU memory is nearly saturated. Reducing texture quality could help improve performance."
          );
        }
        break;
        
      case "memory":
        explanations.push(
          "System memory is the main bottleneck. Consider closing background applications and reducing texture quality."
        );
        break;
        
      case "disk":
        explanations.push(
          "Storage performance is limiting game performance. Consider moving the game to an SSD if it's currently on an HDD."
        );
        break;
    }
  } else if (bottlenecks[0][1] > 0.5 && bottlenecks[1][1] > 0.4) {
    // Multiple significant bottlenecks
    explanations.push(
      `Multiple bottlenecks detected: ${bottlenecks[0][0]} (${Math.round(bottlenecks[0][1]*100)}%) and ${bottlenecks[1][0]} (${Math.round(bottlenecks[1][1]*100)}%). Consider a balanced optimization approach.`
    );
  } else {
    explanations.push(
      "No significant bottlenecks detected. Your system appears well-balanced for gaming."
    );
  }
  
  return explanations;
}

/**
 * Calculate confidence score for predictions
 */
export function calculateConfidenceScore(hardwareData: any, gameId?: string): number {
  // More complete hardware data = higher confidence
  let confidenceScore = 0.5;
  
  if (hardwareData.cpu && hardwareData.cpu.temperature !== undefined) confidenceScore += 0.1;
  if (hardwareData.gpu) confidenceScore += 0.1;
  if (hardwareData.gpu?.temperature !== undefined) confidenceScore += 0.05;
  if (hardwareData.disk) confidenceScore += 0.05;
  if (gameId) confidenceScore += 0.1;
  
  // Cap between 0.4 and 0.95
  return Math.min(Math.max(confidenceScore, 0.4), 0.95);
}
