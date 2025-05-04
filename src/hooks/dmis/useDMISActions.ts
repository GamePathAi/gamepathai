
import { useOptimizationActions } from './actions/useOptimizationActions';
import { useAnalyticsActions } from './actions/useAnalyticsActions';
import { useKnowledgeSharingActions } from './actions/useKnowledgeSharingActions';
import { DMISStatus } from './useDMISStatus';

interface UseDMISActionsProps {
  status: DMISStatus;
}

export function useDMISActions({ status }: UseDMISActionsProps) {
  // Get all the action hooks
  const optimizationActions = useOptimizationActions({ status });
  const analyticsActions = useAnalyticsActions({ status });
  const knowledgeSharingActions = useKnowledgeSharingActions({ status });
  
  // Combine and return all actions
  return {
    ...optimizationActions,
    ...analyticsActions,
    ...knowledgeSharingActions
  };
}
