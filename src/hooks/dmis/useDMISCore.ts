
import { useCallback, useEffect } from 'react';
import { toast } from "sonner";
import { federatedLearningService } from '@/services/dmis/federatedLearning';
import { neuralPredictionEngine } from '@/services/dmis/neuralPrediction';
import { communityKnowledgeService } from '@/services/dmis/communityKnowledge';
import { adaptiveProfilesService } from '@/services/dmis/adaptiveProfiles';
import { selfEvolutionService } from '@/services/dmis/selfEvolution';
import { useDMISStatus } from './useDMISStatus';
import { useDMISActions } from './useDMISActions';

interface UseDMISOptions {
  autoInitialize?: boolean;
  onInitialized?: () => void;
  onError?: (error: Error) => void;
}

export function useDMIS(options: UseDMISOptions = {}) {
  const { 
    status, 
    isInitializing, 
    error, 
    setStatus, 
    setIsInitializing, 
    setError 
  } = useDMISStatus(options.autoInitialize);
  
  const dmisActions = useDMISActions({ status });
  
  // Initialize the DMIS system
  const initialize = useCallback(async () => {
    if (isInitializing || status.initialized) return;
    
    setIsInitializing(true);
    setError(null);
    
    try {
      console.log("🧠 Initializing DMIS system...");
      
      // Initialize federated learning
      const federatedLearningResult = await federatedLearningService.initialize();
      console.log(`✅ Federated learning initialized: ${federatedLearningResult}`);
      
      // Neural prediction is ready when federated learning is ready
      const neuralPredictionReady = federatedLearningResult;
      
      // Initialize community knowledge
      const communityKnowledgeResult = await communityKnowledgeService.initialize();
      console.log(`✅ Community knowledge initialized: ${communityKnowledgeResult}`);
      
      // Initialize adaptive profiles
      const adaptiveProfilesResult = await adaptiveProfilesService.initialize();
      console.log(`✅ Adaptive profiles initialized: ${adaptiveProfilesResult}`);
      
      // Initialize self-evolution
      const selfEvolutionResult = await selfEvolutionService.initialize();
      console.log(`✅ Self-evolution initialized: ${selfEvolutionResult}`);
      
      // Calculate overall score from self-evolution metrics
      const metrics = selfEvolutionService.getMetrics();
      
      // Update status
      setStatus({
        initialized: true,
        federatedLearningReady: federatedLearningResult,
        neuralPredictionReady,
        communityKnowledgeReady: communityKnowledgeResult,
        adaptiveProfilesReady: adaptiveProfilesResult,
        selfEvolutionReady: selfEvolutionResult,
        overallScore: metrics.overallScore
      });
      
      // Call onInitialized callback
      if (options.onInitialized) {
        options.onInitialized();
      }
      
      // Show success toast
      toast.success("DMIS Initialized", {
        description: "Distributed Meta-Intelligence System is ready"
      });
      
      console.log("🎉 DMIS system fully initialized");
    } catch (err) {
      console.error("Failed to initialize DMIS:", err);
      const error = err instanceof Error ? err : new Error("Failed to initialize DMIS");
      setError(error);
      
      // Call onError callback
      if (options.onError) {
        options.onError(error);
      }
      
      // Show error toast
      toast.error("DMIS Initialization Failed", {
        description: error.message
      });
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, status.initialized, options, setIsInitializing, setError, setStatus]);
  
  // Auto-initialize if requested
  useEffect(() => {
    if (options.autoInitialize && !status.initialized && !isInitializing) {
      initialize();
    }
  }, [options.autoInitialize, status.initialized, isInitializing, initialize]);

  return {
    status,
    isInitializing,
    error,
    initialize,
    ...dmisActions,
    
    // Direct access to services
    federatedLearningService,
    neuralPredictionEngine,
    communityKnowledgeService,
    adaptiveProfilesService,
    selfEvolutionService
  };
}
