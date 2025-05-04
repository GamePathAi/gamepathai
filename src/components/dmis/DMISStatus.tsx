
import React from 'react';
import { useDMIS } from '@/hooks/useDMIS';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Zap, Users, GitBranch, BarChart2, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DMISStatusProps {
  showControls?: boolean;
}

export const DMISStatus: React.FC<DMISStatusProps> = ({ showControls = true }) => {
  const {
    status,
    isInitializing,
    error,
    initialize
  } = useDMIS({ autoInitialize: true });

  const getStatusColor = (isReady: boolean) => {
    return isReady ? 'text-cyber-green' : 'text-cyber-red';
  };

  return (
    <Card className="cyber-panel">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-tech flex items-center">
          <Brain className="h-5 w-5 mr-2 text-cyber-purple" />
          Distributed Meta-Intelligence System
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-2 text-cyber-blue" />
                <span className="text-sm">Neural Prediction Engine</span>
              </div>
              <span className={`text-sm ${getStatusColor(status.neuralPredictionReady)}`}>
                {status.neuralPredictionReady ? 'Online' : 'Offline'}
              </span>
            </div>
            <Progress 
              value={status.neuralPredictionReady ? 100 : 0} 
              className="h-1" 
              indicatorClassName={status.neuralPredictionReady ? "bg-cyber-blue" : "bg-cyber-red"} 
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-cyber-green" />
                <span className="text-sm">Community Knowledge Bank</span>
              </div>
              <span className={`text-sm ${getStatusColor(status.communityKnowledgeReady)}`}>
                {status.communityKnowledgeReady ? 'Online' : 'Offline'}
              </span>
            </div>
            <Progress 
              value={status.communityKnowledgeReady ? 100 : 0} 
              className="h-1" 
              indicatorClassName={status.communityKnowledgeReady ? "bg-cyber-green" : "bg-cyber-red"} 
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <GitBranch className="h-4 w-4 mr-2 text-cyber-purple" />
                <span className="text-sm">Adaptive Profiles</span>
              </div>
              <span className={`text-sm ${getStatusColor(status.adaptiveProfilesReady)}`}>
                {status.adaptiveProfilesReady ? 'Online' : 'Offline'}
              </span>
            </div>
            <Progress 
              value={status.adaptiveProfilesReady ? 100 : 0} 
              className="h-1" 
              indicatorClassName={status.adaptiveProfilesReady ? "bg-cyber-purple" : "bg-cyber-red"} 
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <BarChart2 className="h-4 w-4 mr-2 text-cyber-orange" />
                <span className="text-sm">Self-Evolution System</span>
              </div>
              <span className={`text-sm ${getStatusColor(status.selfEvolutionReady)}`}>
                {status.selfEvolutionReady ? 'Online' : 'Offline'}
              </span>
            </div>
            <Progress 
              value={status.selfEvolutionReady ? 100 : 0} 
              className="h-1" 
              indicatorClassName={status.selfEvolutionReady ? "bg-cyber-orange" : "bg-cyber-red"} 
            />
          </div>
          
          <div className="pt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">System Intelligence Score</span>
              <span className="text-sm font-medium">
                {Math.round(status.overallScore * 100)}%
              </span>
            </div>
            <Progress 
              value={status.overallScore * 100} 
              className="h-2" 
              indicatorClassName="bg-gradient-to-r from-cyber-blue to-cyber-purple" 
            />
          </div>
          
          {error && (
            <div className="text-sm text-cyber-red mt-2">
              Error: {error.message}
            </div>
          )}
          
          {showControls && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="border-cyber-purple/30 text-cyber-purple hover:bg-cyber-purple/10"
                onClick={initialize}
                disabled={isInitializing || status.initialized}
              >
                {isInitializing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Initializing...
                  </>
                ) : status.initialized ? (
                  "System Ready"
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Initialize DMIS
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DMISStatus;
