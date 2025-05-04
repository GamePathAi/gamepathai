
// Types for our federated learning system
export interface ModelUpdate {
  modelId: string;
  version: number;
  weights: number[]; // Simplified representation of model weights
  metrics: {
    accuracy: number;
    loss: number;
    timestamp: number;
  };
  hardwareFingerprint: string;
  gameId?: string;
}

export interface FederatedModelConfig {
  modelId: string;
  name: string;
  description: string;
  version: number;
  hyperparameters: Record<string, any>;
  inputShape: number[];
  outputShape: number[];
  lastUpdated: number;
}
