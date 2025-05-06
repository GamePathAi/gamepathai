
/**
 * Utility functions for proxy configuration and network connectivity
 */

// Check if we're in a development environment
export const isDev = () => process.env.NODE_ENV === 'development';

// Generate appropriate API URL based on environment
export const getApiUrl = (path = '') => {
  const baseUrl = process.env.VITE_BACKEND_URL || 'http://localhost:8000';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

// Create headers for API requests
export const createApiHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'X-No-Redirect': '1',
    'X-Development-Mode': isDev() ? '1' : '0',
    'X-GamePath-Client': 'secure-frontend-client',
    'X-Anti-Redirect-Protection': 'enabled'
  };
};

// Fetch with timeout and proper error handling
export const fetchWithTimeout = async (url, options = {}, timeout = 8000) => {
  const controller = new AbortController();
  const { signal } = controller;
  
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal,
      headers: {
        ...createApiHeaders(),
        ...(options.headers || {})
      }
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`Fetch error for ${url}:`, error);
    throw error;
  }
};
