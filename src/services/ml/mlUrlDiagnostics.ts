
/**
 * ML URL diagnostics for detecting and preventing redirects
 */

import { sanitizeApiUrl } from '../../utils/url';

/**
 * Test result for a URL diagnostics check
 */
interface URLTestResult {
  wasRedirected: boolean;
  finalUrl: string;
  isGamePathAI: boolean;
  responseStatus?: number;
}

/**
 * ML URL diagnostics service
 * Provides utilities for testing URLs for redirect issues
 */
export const mlUrlDiagnostics = {
  /**
   * Test a URL for redirect issues
   * @param url The URL to test
   */
  testUrl: async (url: string): Promise<URLTestResult> => {
    // Always use sanitized URLs
    const sanitizedUrl = sanitizeApiUrl(url);
    console.log(`🧪 Testing URL: ${sanitizedUrl}`);
    
    try {
      // Use a no-follow strategy to detect redirects
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // First do a head request to check redirect without following
      const response = await fetch(sanitizedUrl, {
        method: 'GET',
        headers: {
          'X-No-Redirect': '1',
          'Cache-Control': 'no-cache, no-store',
          'X-URL-Test': '1'
        },
        redirect: 'manual',
        signal: controller.signal,
        cache: 'no-store',
        credentials: 'omit'
      });
      
      clearTimeout(timeoutId);
      
      // Check if we got redirected
      const wasRedirected = response.type === 'opaqueredirect' || 
                          (response.url && response.url !== sanitizedUrl);
      
      let finalUrl = response.url || sanitizedUrl;
      const isGamePathAI = finalUrl && finalUrl.includes('gamepathai.com');
      
      console.log(`📊 URL Test Result: 
        - Original: ${sanitizedUrl}
        - Redirected: ${wasRedirected ? 'Yes' : 'No'}
        - Final URL: ${finalUrl}
        - GamePathAI domain: ${isGamePathAI ? 'Yes' : 'No'}
        - Status: ${response.status}
      `);
      
      return {
        wasRedirected,
        finalUrl,
        isGamePathAI,
        responseStatus: response.status
      };
    } catch (error) {
      console.error('❌ Error testing URL:', error);
      
      if (error.name === 'AbortError') {
        console.warn('⚠️ URL test timeout');
        return {
          wasRedirected: true,
          finalUrl: 'Timeout error',
          isGamePathAI: false,
          responseStatus: 0
        };
      }
      
      return {
        wasRedirected: true,
        finalUrl: error.message,
        isGamePathAI: error.message && error.message.includes('gamepathai.com'),
        responseStatus: 0
      };
    }
  },
  
  /**
   * Test a batch of URLs for redirect issues
   * @param urls Array of URLs to test
   */
  testMultipleUrls: async (urls: string[]): Promise<Record<string, URLTestResult>> => {
    const results: Record<string, URLTestResult> = {};
    
    for (const url of urls) {
      try {
        results[url] = await mlUrlDiagnostics.testUrl(url);
      } catch (error) {
        results[url] = {
          wasRedirected: true,
          finalUrl: `Error: ${error.message}`,
          isGamePathAI: false,
          responseStatus: 0
        };
      }
    }
    
    return results;
  }
};
