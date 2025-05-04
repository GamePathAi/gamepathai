
import { useState, useCallback, useEffect } from 'react';
import { selfEvolutionService } from '@/services/dmis/selfEvolution';

export interface DMISStatus {
  initialized: boolean;
  federatedLearningReady: boolean;
  neuralPredictionReady: boolean;
  communityKnowledgeReady: boolean;
  adaptiveProfilesReady: boolean;
  selfEvolutionReady: boolean;
  overallScore: number;
}

export function useDMISStatus(autoInitialize = false) {
  const [status, setStatus] = useState<DMISStatus>({
    initialized: false,
    federatedLearningReady: false,
    neuralPredictionReady: false,
    communityKnowledgeReady: false,
    adaptiveProfilesReady: false,
    selfEvolutionReady: false,
    overallScore: 0.5
  });
  
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  /**
   * Get the DMIS System status
   */
  const getStatus = useCallback(() => {
    // Update overallScore from self-evolution metrics
    if (status.selfEvolutionReady) {
      const metrics = selfEvolutionService.getMetrics();
      if (metrics.overallScore !== status.overallScore) {
        setStatus(prev => ({
          ...prev,
          overallScore: metrics.overallScore
        }));
      }
    }
    
    return status;
  }, [status]);
  
  return {
    status: getStatus(),
    isInitializing,
    error,
    setStatus,
    setIsInitializing,
    setError
  };
}
