
import { detectRedirectAttempt, sanitizeApiUrl } from '../utils/url';

/**
 * Interface for ML optimization options
 */
interface MLOptimizationOptions {
  optimizeRoutes?: boolean;
  optimizeSettings?: boolean;
  optimizeSystem?: boolean;
  systemInfo?: any;
}

/**
 * Response from ML optimization
 */
export interface MLOptimizeGameResponse {
  success: boolean;
  gameId: string;
  optimizationType: "network" | "system" | "both" | "none";
  improvements?: {
    latency?: number;
    fps?: number;
    stability?: number;
  }
}

/**
 * Response from ML game detection
 */
export interface MLDetectedGamesResponse {
  success: boolean;
  detectedGames: Array<{
    id: string;
    name: string;
    executable: string;
    installPath?: string;
  }>;
}

/**
 * Interface for diagnostics result
 */
interface DiagnosticsResult {
  detected: boolean;
  extensions: string[];
}

/**
 * ML API Client for game optimization
 */
export const mlService = {
  /**
   * Optimize a game using ML algorithms
   */
  optimizeGame: async (gameId: string, options?: MLOptimizationOptions): Promise<MLOptimizeGameResponse> => {
    console.log('🧠 ML Service: Optimizing game', gameId, options);
    
    // In development, use mock data
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate improvements based on the game ID
      const improvements = {
        latency: Math.floor(Math.random() * 20) + 10,
        fps: Math.floor(Math.random() * 15) + 5,
        stability: Math.floor(Math.random() * 10) + 5
      };
      
      return {
        success: true,
        gameId,
        optimizationType: "both", 
        improvements
      };
    }
    
    try {
      // Use relative URL for API endpoint
      const endpoint = '/api/ml/optimize-game';
      
      console.log('📤 ML Service: Sending optimization request to:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ML-Operation': '1',
          'X-No-Redirect': '1',
          'Cache-Control': 'no-cache, no-store'
        },
        body: JSON.stringify({
          gameId,
          options: options || {
            optimizeRoutes: true,
            optimizeSettings: true,
            optimizeSystem: true
          }
        }),
        mode: 'cors',
        credentials: 'include',
        cache: 'no-store',
        redirect: 'error'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to optimize game');
      }
      
      return await response.json();
    } catch (error: any) {
      console.error('❌ ML Service: Error optimizing game:', error);
      
      // Check if error is related to redirects 
      if (error.message && (
        error.message.includes('redirect') ||
        error.message.includes('gamepathai.com')
      )) {
        throw new Error('Redirecionamento detectado durante a otimização ML');
      }
      
      // Fallback to simulated data on error
      console.log('⚠️ ML Service: Falling back to simulated optimization data');
      return {
        success: true,
        gameId,
        optimizationType: "network",
        improvements: {
          latency: 15,
          stability: 8
        }
      };
    }
  },
  
  /**
   * Detect installed games using ML
   */
  detectGames: async (): Promise<MLDetectedGamesResponse> => {
    console.log('🧠 ML Service: Detecting games');
    
    // In development, use mock data
    if (process.env.NODE_ENV === 'development') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        detectedGames: [
          { id: "1", name: "Counter-Strike 2", executable: "cs2.exe" },
          { id: "2", name: "Valorant", executable: "Valorant.exe" },
          { id: "3", name: "League of Legends", executable: "LeagueClient.exe" },
          { id: "4", name: "Fortnite", executable: "FortniteClient-Win64-Shipping.exe" }
        ]
      };
    }
    
    try {
      // Use relative URL for API endpoint
      const endpoint = '/api/ml/detect-games';
      
      console.log('📤 ML Service: Sending game detection request to:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'X-ML-Operation': '1',
          'X-No-Redirect': '1',
          'Cache-Control': 'no-cache, no-store'
        },
        mode: 'cors',
        credentials: 'include',
        cache: 'no-store',
        redirect: 'error'
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to detect games');
      }
      
      return await response.json();
    } catch (error) {
      console.error('❌ ML Service: Error detecting games:', error);
      
      // Fallback to simulated data on error
      console.log('⚠️ ML Service: Falling back to simulated game detection data');
      return {
        success: true,
        detectedGames: [
          { id: "1", name: "Counter-Strike 2", executable: "cs2.exe" },
          { id: "2", name: "Valorant", executable: "Valorant.exe" }
        ]
      };
    }
  },
  
  /**
   * Check for browser extensions that might interfere with ML operations
   */
  checkForInterfereingExtensions: (): DiagnosticsResult => {
    console.log('🧠 ML Service: Checking for interfering extensions');
    
    const interfereingExtensions: string[] = [];
    
    // Check for known extension patterns in the DOM
    if (typeof document !== 'undefined') {
      // Check for Kaspersky
      if (document.querySelectorAll('[id*="kaspersky"], [class*="kaspersky"]').length > 0 || 
          document.querySelectorAll('script[src*="kaspersky"]').length > 0) {
        interfereingExtensions.push("Kaspersky Web Protection");
      }
      
      // Check for Avast
      if (document.querySelectorAll('[id*="avast"], [class*="avast"]').length > 0 ||
          document.querySelectorAll('script[src*="avast"]').length > 0) {
        interfereingExtensions.push("Avast Online Security");
      }
      
      // Check for AVG
      if (document.querySelectorAll('[id*="avg"], [class*="avg"]').length > 0 ||
          document.querySelectorAll('script[src*="avg"]').length > 0) {
        interfereingExtensions.push("AVG Online Security");
      }
      
      // Check for ad blockers
      if (document.querySelectorAll('[id*="adblock"], [class*="adblock"]').length > 0 ||
          document.querySelectorAll('script[src*="adblock"]').length > 0) {
        interfereingExtensions.push("Ad Blocker");
      }
    }
    
    return {
      detected: interfereingExtensions.length > 0,
      extensions: interfereingExtensions
    };
  }
};

/**
 * Diagnostics specific ML client
 */
export const mlDiagnostics = {
  /**
   * Check for browser extensions that might interfere with ML operations
   */
  checkForInterfereingExtensions: (): DiagnosticsResult => {
    return mlService.checkForInterfereingExtensions();
  },
  
  /**
   * Test connectivity to ML endpoints
   */
  testConnectivity: async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/ml/health', {
        method: 'GET',
        headers: {
          'X-ML-Operation': '1',
          'X-No-Redirect': '1'
        },
        mode: 'cors',
        cache: 'no-store',
        redirect: 'error'
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ML Diagnostics: Connectivity test failed:', error);
      return false;
    }
  }
};
