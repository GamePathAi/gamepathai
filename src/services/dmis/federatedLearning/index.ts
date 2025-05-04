
export * from './types';
export * from './modelSynchronization';
export * from './modelTraining';
export * from './service';

// Re-export the service instance for easy access
import { federatedLearningService } from './service';
export { federatedLearningService };
