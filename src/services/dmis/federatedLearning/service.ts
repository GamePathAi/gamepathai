
import { v4 as uuidv4 } from 'uuid';
import { ModelSynchronization } from './modelSynchronization';
import { ModelTraining } from './modelTraining';

/**
 * Service to handle federated learning operations
 */
export class FederatedLearningService {
  private deviceId: string;
  private modelSync: ModelSynchronization;
  private modelTraining: ModelTraining;
  
  constructor() {
    // Generate a unique device ID if one doesn't exist
    this.deviceId = localStorage.getItem('deviceId') || uuidv4();
    localStorage.setItem('deviceId', this.deviceId);
    
    // Initialize model synchronization
    this.modelSync = new ModelSynchronization(this.deviceId);
    
    // Initialize model training with references to models and configs
    this.modelTraining = new ModelTraining(
      this.modelSync.getModels(),
      this.modelSync.getModelConfigs(),
      this.modelSync.queueModelUpdateForSync.bind(this.modelSync)
    );
  }
  
  /**
   * Initialize the federated learning system
   */
  public async initialize(): Promise<boolean> {
    try {
      console.log("🧠 Initializing Federated Learning System...");
      
      // Load model configurations from server
      await this.modelSync.fetchModelConfigurations();
      
      // Set up periodic model synchronization
      this.modelSync.setupModelSynchronization();
      
      return true;
    } catch (error) {
      console.error("Failed to initialize federated learning:", error);
      return false;
    }
  }
  
  /**
   * Train a model locally using device data
   */
  public async trainModel(modelId: string, trainingData: { inputs: number[][], outputs: number[][] }): Promise<boolean> {
    return this.modelTraining.trainModel(modelId, trainingData);
  }
  
  /**
   * Make predictions using a trained model
   */
  public predict(modelId: string, input: number[]): number[] | null {
    return this.modelTraining.predict(modelId, input);
  }
  
  /**
   * Synchronize models with the server
   */
  public async synchronizeModels(): Promise<void> {
    return this.modelSync.synchronizeModels();
  }
  
  /**
   * Get hardware fingerprint for model training
   */
  public getHardwareFingerprint(): string {
    // In a real implementation, this would generate a unique fingerprint
    // based on hardware characteristics
    return this.deviceId;
  }
  
  /**
   * Clean up resources when service is destroyed
   */
  public destroy(): void {
    this.modelSync.cleanup();
  }
}

export const federatedLearningService = new FederatedLearningService();
