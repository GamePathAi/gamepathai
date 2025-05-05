
import { mlApiClient } from './mlApiClient';

// Define necessary types
export interface MLConnectivityTestResult {
  success: boolean;
  results: Record<string, { success: boolean; error?: string }>;
}

export interface MLRedirectProtectionResult {
  protected: boolean;
  details: string;
}

export interface MLExtensionCheckResult {
  detected: boolean;
  extensions: string[];
}

export interface MLUrlTestResult {
  wasRedirected: boolean;
  finalUrl: string;
  isGamePathAI: boolean;
  responseStatus?: number;
}

const isDev = process.env.NODE_ENV === 'development';

/**
 * ML Diagnostics tools for debugging connectivity issues
 */
export const mlDiagnostics = {
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
        redirect: isDev ? 'follow' : 'error'
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ ML Diagnostics: Connectivity test failed:', error);
      return false;
    }
  },
  
  /**
   * Check for browser extensions that might interfere with ML operations
   */
  checkForInterfereingExtensions: (): MLExtensionCheckResult => {
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
  },
  
  /**
   * Run a comprehensive ML connection test
   */
  runDiagnostics: async (): Promise<MLConnectivityTestResult> => {
    const results = {
      success: false,
      results: {} as Record<string, { success: boolean; error?: string }>
    };
    
    // Test basic health endpoint
    try {
      results.success = await mlDiagnostics.testConnectivity();
      results.results['health'] = { success: results.success };
    } catch (e: any) {
      results.success = false;
      results.results['health'] = { success: false, error: e.message };
    }
    
    // Check for extensions
    const extCheck = mlDiagnostics.checkForInterfereingExtensions();
    results.results['extensions'] = { 
      success: !extCheck.detected,
      error: extCheck.detected ? `Detected: ${extCheck.extensions.join(', ')}` : undefined 
    };
    
    // Test common ML endpoints
    const endpoints = [
      '/ml/health',
      '/api/ml/health',
      '/api/ml/game-detection',
      '/api/ml/route-optimizer'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'HEAD',
          headers: { 'X-ML-Operation': '1', 'X-No-Redirect': '1' },
          redirect: 'manual'
        });
        results.results[endpoint] = { success: response.ok };
      } catch (e: any) {
        results.results[endpoint] = { success: false, error: e.message };
      }
    }
    
    return results;
  },

  /**
   * Test whether a URL is protected against redirects
   */
  testRedirectProtection: async (url: string): Promise<MLRedirectProtectionResult> => {
    try {
      // Try to follow redirects
      const response = await fetch(url, {
        redirect: 'follow'
      });
      
      return {
        protected: !response.redirected,
        details: response.redirected ? 
          `Redirected to: ${response.url}` : 
          'No redirect detected'
      };
    } catch (e) {
      return {
        protected: true,
        details: 'Redirect blocked by browser or fetch policy'
      };
    }
  },
  
  /**
   * Test a specific URL for redirect issues
   */
  testUrl: async (url: string): Promise<MLUrlTestResult> => {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow'
      });
      
      return {
        wasRedirected: response.redirected,
        finalUrl: response.url,
        isGamePathAI: response.url.includes('gamepathai.com'),
        responseStatus: response.status
      };
    } catch (e) {
      return {
        wasRedirected: false,
        finalUrl: url,
        isGamePathAI: url.includes('gamepathai.com')
      };
    }
  }
};
