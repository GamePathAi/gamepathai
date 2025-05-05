
import { secureFetch } from "../../utils/url/ApiInterceptor";
import { UrlUtility } from "../../utils/url/UrlUtility";

// Remove noisy logging and only log in development
const isDev = process.env.NODE_ENV === 'development';
if (isDev) {
  console.log("API_BASE_URL being used:", UrlUtility.getApiBaseUrl());
}

export const baseApiClient = {
  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      // Use the enhanced secureFetch utility
      return await secureFetch<T>(endpoint, options);
    } catch (error: any) {
      console.error(`❌ Request failed for ${endpoint}:`, error);
      
      // Re-throw with enhanced error information
      throw {
        status: error.status || 'error',
        message: error.message || 'Failed to fetch data from server',
        originalError: error
      };
    }
  }
};

// Function to attempt token renewal
async function tryRenewToken() {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;
    
    // Use a secure relative path
    const url = `/auth/refresh-token`;
    
    // Use secureFetch directly for auth operations
    const response = await secureFetch(url, {
      method: "POST",
      skipAuth: true, // Skip adding the expired auth token
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    
    // Handle successful token refresh
    if (response && response.access_token) {
      localStorage.setItem("auth_token", response.access_token);
      if (response.refresh_token) {
        localStorage.setItem("refresh_token", response.refresh_token);
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}

// Export the token renewal function for use in other auth-related files
export { tryRenewToken };
