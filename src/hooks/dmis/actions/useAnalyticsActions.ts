
import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { HardwareData } from '@/types/metrics';
import { neuralPredictionEngine } from '@/services/dmis/neuralPrediction';
import { selfEvolutionService } from '@/services/dmis/selfEvolution';
import { DMISStatus } from '../useDMISStatus';

interface UseAnalyticsActionsProps {
  status: DMISStatus;
}

export function useAnalyticsActions({ status }: UseAnalyticsActionsProps) {
  /**
   * Analyze hardware bottlenecks
   */
  const analyzeBottlenecks = useCallback(async (
    hardwareData: HardwareData,
    gameId?: string
  ) => {
    if (!status.initialized) {
      throw new Error("DMIS not initialized");
    }
    
    if (!status.neuralPredictionReady) {
      throw new Error("Neural prediction not ready");
    }
    
    try {
      console.log("🔍 Analyzing hardware bottlenecks");
      
      const prediction = await neuralPredictionEngine.predictBottlenecks(
        hardwareData,
        gameId,
        { includeExplanations: true }
      );
      
      return {
        bottlenecks: prediction.predictions,
        confidence: prediction.confidence,
        explanations: prediction.explanations || [],
        timestamp: prediction.timestamp
      };
    } catch (error) {
      console.error("Error analyzing bottlenecks:", error);
      throw error;
    }
  }, [status]);

  /**
   * Report optimization results for self-evolution
   */
  const reportOptimizationResult = useCallback((
    gameId: string,
    predictedSettings: Record<string, any>,
    actualPerformance: { fps: number; frameTime: number; stability: number },
    expectedPerformance: { fps: number; frameTime: number; stability: number }
  ) => {
    if (!status.initialized || !status.selfEvolutionReady) {
      return;
    }
    
    try {
      console.log("📊 Reporting optimization results for self-evolution");
      
      // Generate a unique ID for this optimization
      const optimizationId = uuidv4();
      
      // Record the result
      selfEvolutionService.recordOptimizationResult(
        optimizationId,
        gameId,
        predictedSettings,
        actualPerformance,
        expectedPerformance
      );
      
      return optimizationId;
    } catch (error) {
      console.error("Error reporting optimization result:", error);
    }
  }, [status]);

  return {
    analyzeBottlenecks,
    reportOptimizationResult
  };
}
