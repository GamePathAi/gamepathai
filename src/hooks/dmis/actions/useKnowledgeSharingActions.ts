
import { useCallback } from 'react';
import { communityKnowledgeService } from '@/services/dmis/communityKnowledge';
import { DMISStatus } from '../useDMISStatus';

interface UseKnowledgeSharingActionsProps {
  status: DMISStatus;
}

export function useKnowledgeSharingActions({ status }: UseKnowledgeSharingActionsProps) {
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

  return {
    shareOptimizationKnowledge
  };
}
