
import { UrlUtility } from "../../utils/url/UrlUtility";
import { secureFetch } from "../../utils/url/ApiInterceptor";

const isDev = process.env.NODE_ENV === 'development';

/**
 * Function to test the connection with the backend
 * Uses our enhanced URL utilities for better security
 */
export const testBackendConnection = async () => {
  // Try multiple API endpoints for health check
  const endpoints = ['/health', '/api/health', '/api/v1/health'];
  
  for (const endpoint of endpoints) {
    try {
      if (isDev) {
        console.log("Testing connection with:", endpoint);
      }
      
      // Use standard fetch for health checks with timeout
      const response = await fetch(endpoint, { 
        mode: 'cors',
        method: 'GET',
        headers: {
          "Accept": "application/json",
          "X-No-Redirect": "1",
          "Cache-Control": "no-cache",
          "X-Development-Mode": isDev ? "1" : "0",
          "X-Requested-With": "XMLHttpRequest"
        },
        signal: AbortSignal.timeout(5000), // 5 seconds timeout using modern API
        cache: 'no-store',
        // Only block redirects in production
        redirect: isDev ? 'follow' : 'error'
      });
      
      if (response.ok) {
        if (isDev) {
          console.log(`Backend connection successful with endpoint: ${endpoint}`);
        }
        return true;
      }
    } catch (error) {
      if (isDev) {
        console.log(`Backend endpoint ${endpoint} not available:`, 
                   error.name === 'AbortError' ? 'timeout' : error.message);
      }
      // Continue to try next endpoint
    }
  }
  
  // All endpoints failed
  console.error("All backend connection tests failed");
  return false;
};

/**
 * Function to check for redirections by AWS load balancer
 */
export const testAWSConnection = async () => {
  // Try multiple approaches to check AWS connection
  const approaches = [
    { method: 'GET', endpoint: '/health' },
    { method: 'HEAD', endpoint: '/health' },
    { method: 'GET', endpoint: '/api/health' }
  ];
  
  for (const { method, endpoint } of approaches) {
    try {
      console.log(`Testing AWS connection with ${method} ${endpoint}`);
      
      const response = await fetch(endpoint, { 
        mode: 'cors',
        method,
        headers: {
          "Accept": "application/json",
          "X-No-Redirect": "1",
          "Cache-Control": "no-cache"
        },
        signal: AbortSignal.timeout(5000),
        // In development, allow following redirects
        redirect: isDev ? 'follow' : 'error'
      });
      
      if (response.ok) {
        console.log(`AWS connection successful with ${method} ${endpoint}`);
        
        // Check for redirections
        if (response.url && !response.url.includes(endpoint)) {
          console.warn(`⚠️ AWS connection succeeded but with redirect: ${endpoint} -> ${response.url}`);
          
          // If the redirect is to gamepathai.com, consider it a failure
          if (response.url.includes('gamepathai.com')) {
            console.error(`⚠️ AWS connection redirected to gamepathai.com`);
            continue; // Try next approach
          }
        }
        
        return true;
      }
    } catch (error) {
      console.log(`AWS connection test failed for ${method} ${endpoint}:`, 
                 error.name === 'AbortError' ? 'timeout' : error.message);
      // Continue to next approach
    }
  }
  
  console.error("All AWS connection tests failed");
  return false;
};

/**
 * Test a specific ML endpoint without triggering redirects
 */
export const testMlEndpoint = async (endpoint: string) => {
  try {
    // Make sure the endpoint is relative and validate it's an ML endpoint
    const relativeEndpoint = UrlUtility.toRelativeApiUrl(endpoint);
    
    // For ML endpoints, perform additional validation
    if (endpoint.includes('/ml/') && !UrlUtility.isValidMlEndpoint(relativeEndpoint)) {
      return {
        success: false,
        error: 'Invalid ML endpoint format'
      };
    }
    
    // Use HEAD request for testing to minimize data transfer
    const response = await fetch(relativeEndpoint, {
      method: 'HEAD',
      headers: {
        "X-No-Redirect": "1",
        "X-ML-Operation": "1",
        "Cache-Control": "no-cache, no-store",
        "Pragma": "no-cache"
      },
      signal: AbortSignal.timeout(5000),
      mode: 'cors',
      credentials: 'include',
      cache: 'no-store',
      redirect: 'error'
    });
    
    return {
      success: response.ok,
      status: response.status,
      url: response.url
    };
  } catch (error) {
    console.error(`ML endpoint test failed for ${endpoint}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
};
