
import { getApiBaseUrl } from "../../utils/url";

const isDev = process.env.NODE_ENV === 'development';

/**
 * Function to test the connection with the backend
 */
export const testBackendConnection = async () => {
  try {
    // Always use relative URLs for API calls - no hardcoded domains
    const url = `/health`;
    
    if (isDev) {
      console.log("Testing connection with:", url);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout
    
    // Use GET with proper headers to prevent redirects
    const response = await fetch(url, { 
      mode: 'cors',
      method: 'GET',
      headers: {
        "Accept": "application/json",
        "X-No-Redirect": "1", // Prevent redirects
        "Cache-Control": "no-cache", // Prevent caching
        "X-Development-Mode": isDev ? "1" : "0",
        "X-Max-Redirects": "0",
        "X-Requested-With": "XMLHttpRequest"
      },
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'error' // Explicitly error on redirects instead of following
    });
    
    clearTimeout(timeoutId);
    
    if (isDev) {
      console.log(`Backend connection ${response.ok ? 'successful' : 'failed'} with status: ${response.status}`);
    }
    
    return response.ok;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("Backend connection test timed out");
    } else {
      console.error("Backend connection test failed:", error);
    }
    return false;
  }
};

/**
 * Function to check for redirections by AWS load balancer
 */
export const testAWSConnection = async () => {
  try {
    // Use relative URL for testing AWS connection
    const healthUrl = '/health';
    
    console.log("Testing AWS connection with:", healthUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(healthUrl, { 
      mode: 'cors',
      method: 'GET',
      headers: {
        "Accept": "application/json",
        "X-No-Redirect": "1",
        "X-Max-Redirects": "0",
        "X-Requested-With": "XMLHttpRequest"
      },
      signal: controller.signal,
      redirect: 'error' // Explicitly error on redirects
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("AWS connection test failed:", error);
    return false;
  }
};
