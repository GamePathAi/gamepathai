
import { useState, useEffect, useCallback } from 'react';
import { federatedLearningService } from '@/services/dmis/federatedLearning';
import { neuralPredictionEngine } from '@/services/dmis/neuralPrediction';
import { communityKnowledgeService } from '@/services/dmis/communityKnowledge';
import { adaptiveProfilesService } from '@/services/dmis/adaptiveProfiles';
import { selfEvolutionService } from '@/services/dmis/selfEvolution';
import { HardwareData } from '@/types/metrics';
import { v4 as uuidv4 } from 'uuid';
import { toast } from "sonner";

interface UseDMISOptions {
  autoInitialize?: boolean;
  onInitialized?: () => void;
  onError?: (error: Error) => void;
}

interface DMISStatus {
  initialized: boolean;
  federatedLearningReady: boolean;
  neuralPredictionReady: boolean;
  communityKnowledgeReady: boolean;
  adaptiveProfilesReady: boolean;
  selfEvolutionReady: boolean;
  overallScore: number;
}

export function useDMIS(options: UseDMISOptions = {}) {
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
  }, [isInitializing, status.initialized, options]);
  
  // Auto-initialize if requested
  useEffect(() => {
    if (options.autoInitialize && !status.initialized && !isInitializing) {
      initialize();
    }
  }, [options.autoInitialize, status.initialized, isInitializing, initialize]);
  
  /**
   * Generate optimized settings for a game
   */
  const generateOptimizedSettings = useCallback(async (
    gameId: string,
    hardwareData: HardwareData,
    currentSettings?: Record<string, any>
  ) => {
    if (!status.initialized) {
      throw new Error("DMIS not initialized");
    }
    
    try {
      console.log(`🎮 Generating optimized settings for game: ${gameId}`);
      
      // Check if we have an adaptive profile for this game
      const activeProfile = adaptiveProfilesService.getActiveProfile(gameId);
      
      if (activeProfile) {
        // Use the adaptive profile to generate settings
        console.log(`📊 Using adaptive profile: ${activeProfile.name}`);
        const adaptedSettings = adaptiveProfilesService.applyAdaptiveSettings(gameId, hardwareData);
        
        if (adaptedSettings) {
          return {
            settings: adaptedSettings,
            source: "adaptive_profile",
            confidence: 0.85,
            profileId: activeProfile.id
          };
        }
      }
      
      // If no adaptive profile or it failed, use neural prediction
      if (status.neuralPredictionReady) {
        console.log("🧠 Using neural prediction engine");
        const prediction = await neuralPredictionEngine.predictOptimalSettings(
          gameId,
          hardwareData, 
          currentSettings || {}
        );
        
        return {
          settings: prediction.predictions,
          source: "neural_prediction",
          confidence: prediction.confidence,
          explanations: prediction.explanations
        };
      }
      
      // If neural prediction isn't available, use community knowledge
      if (status.communityKnowledgeReady) {
        console.log("📚 Using community knowledge");
        const knowledgeEntries = communityKnowledgeService.queryKnowledge({
          gameId,
          sortBy: "performance",
          limit: 1
        });
        
        if (knowledgeEntries.length > 0) {
          return {
            settings: knowledgeEntries[0].settingsConfig,
            source: "community_knowledge",
            confidence: 0.7,
            knowledgeId: knowledgeEntries[0].id
          };
        }
      }
      
      // Fallback to default settings
      console.log("⚠️ No optimization source available, using defaults");
      return {
        settings: {
          resolution: 0.5,      // 1080p
          graphics_quality: 0.5, // Medium
          antialiasing: 0.5,     // Medium
          shadows: 0.5,          // Medium
          textures: 0.5,         // Medium
          effects: 0.5,          // Medium
          view_distance: 0.5,    // Medium
          fps_cap: 0.6          // 60fps
        },
        source: "default",
        confidence: 0.5
      };
    } catch (error) {
      console.error("Error generating optimized settings:", error);
      throw error;
    }
  }, [status]);
  
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
   * Generate an optimized game profile
   */
  const generateOptimizedProfile = useCallback(async (
    gameId: string,
    hardwareData: HardwareData,
    currentSettings?: Record<string, any>
  ) => {
    if (!status.initialized) {
      throw new Error("DMIS not initialized");
    }
    
    if (!status.adaptiveProfilesReady) {
      throw new Error("Adaptive profiles not ready");
    }
    
    try {
      console.log("🎮 Generating optimized game profile");
      
      const profileId = await adaptiveProfilesService.generateOptimizedProfile(
        gameId,
        hardwareData,
        currentSettings
      );
      
      if (!profileId) {
        throw new Error("Failed to generate optimized profile");
      }
      
      // Activate the profile
      adaptiveProfilesService.activateProfile(profileId);
      
      // Get the profile
      const profile = adaptiveProfilesService.getAllProfiles()
        .find(p => p.id === profileId);
      
      return { profileId, profile };
    } catch (error) {
      console.error("Error generating optimized profile:", error);
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
  
  /**
   * Share optimization knowledge with the community
   */
  const shareOptimizationKnowledge = useCallback((
    gameId: string,
    settingsConfig: Record<string, any>,
    performance: { fps: number; frameTime: number; stability: number },
    hardwareFingerprint?: string,
    tags: string[] = []
  ) => {
    if (!status.initialized || !status.communityKnowledgeReady) {
      throw new Error("Community knowledge not ready");
    }
    
    try {
      console.log("📤 Sharing optimization knowledge with community");
      
      const entryId = communityKnowledgeService.submitKnowledgeEntry(
        gameId,
        settingsConfig,
        performance,
        hardwareFingerprint,
        tags
      );
      
      return entryId;
    } catch (error) {
      console.error("Error sharing optimization knowledge:", error);
      throw error;
    }
  }, [status]);
  
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
    initialize,
    generateOptimizedSettings,
    analyzeBottlenecks,
    generateOptimizedProfile,
    reportOptimizationResult,
    shareOptimizationKnowledge,
    
    // Direct access to services
    federatedLearningService,
    neuralPredictionEngine,
    communityKnowledgeService,
    adaptiveProfilesService,
    selfEvolutionService
  };
}
