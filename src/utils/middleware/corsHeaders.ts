
/**
 * Middleware utilities for adding CORS and security headers to requests
 */

/**
 * Adds CORS headers to all outgoing requests
 * @param request The fetch request to modify
 */
export const addCorsHeaders = (request: RequestInit): RequestInit => {
  return {
    ...request,
    headers: {
      ...request.headers,
      'X-No-Redirect': '1', // Prevent redirects
      'X-Requested-With': 'XMLHttpRequest', // Mark as AJAX request
      'Cache-Control': 'no-cache, no-store', // Prevent caching
      'Pragma': 'no-cache'
    },
    mode: 'cors',
    credentials: 'include',
    cache: 'no-store', // Prevent cache at fetch level
    redirect: 'error' // Error on redirects instead of following them
  };
};

/**
 * Specialized headers for ML operations which have different timing requirements
 */
export const addMLHeaders = (request: RequestInit): RequestInit => {
  return {
    ...request,
    headers: {
      ...request.headers,
      'X-No-Redirect': '1', // Prevent redirects
      'X-ML-Operation': '1', // Mark as ML operation for server identification
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache, no-store',
      'Pragma': 'no-cache',
    },
    mode: 'cors',
    credentials: 'include',
    cache: 'no-store',
    redirect: 'error', // Error on redirects instead of following them
  };
};
