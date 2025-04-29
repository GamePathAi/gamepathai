
import { apiClient } from "../api";

const RETRY_COUNT = 2; // Número de tentativas de retry
const RETRY_DELAY = 1000; // Delay entre tentativas (ms)

export const metricsClient = {
  fetch: async <T>(endpoint: string): Promise<T> => {
    let lastError;
    
    for (let attempt = 0; attempt <= RETRY_COUNT; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retry attempt ${attempt} for ${endpoint}`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
        
        return await apiClient.fetch<T>(endpoint);
      } catch (error: any) {
        lastError = error;
        
        // If we got HTML instead of JSON, don't retry
        if (error.isHtmlResponse) {
          console.warn(`Received HTML response from ${endpoint} when JSON was expected.`);
          break;
        }
        
        // Se erro for diferente de problemas de rede, não tente novamente
        if (error.status && typeof error.status === 'number' && error.status !== 0 && error.status !== 408 && error.status !== 429) {
          break;
        }
      }
    }
    
    console.log(`Falling back to mock data for ${endpoint} after ${RETRY_COUNT} failed attempts`);
    throw lastError;
  }
};
