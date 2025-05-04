
import { getApiBaseUrl } from "../../utils/url";

const isDev = process.env.NODE_ENV === 'development';

/**
 * Function to test the connection with the backend
 * IMPROVED: More resilient with multiple retry attempts
 */
export const testBackendConnection = async () => {
  // Try multiple API endpoints for health check
  const endpoints = ['/health', '/api/health', '/api/v1/health'];
  
  for (const endpoint of endpoints) {
    try {
      if (isDev) {
        console.log("Testing connection with:", endpoint);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout
      
      // Use GET with proper headers - more likely to succeed than HEAD
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
        signal: controller.signal,
        cache: 'no-store',
        // Only block redirects in production
        redirect: isDev ? 'follow' : 'error'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        if (isDev) {
          console.log(`Backend connection successful with endpoint: ${endpoint}`);
        }
        return true;
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`Backend connection test timed out for endpoint: ${endpoint}`);
      } else if (isDev) {
        console.log(`Backend endpoint ${endpoint} not available:`, error.message);
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
 * IMPROVED: More resilient with fallback approaches
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
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(endpoint, { 
        mode: 'cors',
        method,
        headers: {
          "Accept": "application/json",
          "X-No-Redirect": "1",
          "Cache-Control": "no-cache"
        },
        signal: controller.signal,
        // In development, allow following redirects
        redirect: isDev ? 'follow' : 'error'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        console.log(`AWS connection successful with ${method} ${endpoint}`);
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
