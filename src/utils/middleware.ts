
/**
 * Middleware utilities for handling CORS and preventing unwanted redirects
 */

import { 
  detectRedirectAttempt, 
  fixAbsoluteUrl, 
  sanitizeApiUrl,
  setupNavigationMonitor,
  detectRedirectScripts
} from './url';

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

/**
 * Intercepts fetch to prevent unwanted redirects
 * Call this function at app initialization to patch global fetch
 */
export const setupFetchInterceptor = (): void => {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    // Get the URL as a string
    const originalUrl = typeof input === 'string' ? input : input.toString();
    const isMLOperation = init?.headers && 
      typeof init.headers === 'object' &&
      ('X-ML-Operation' in init.headers);
      
    // Sanitize URLs to ensure they're handled properly - use relative URLs whenever possible
    let url = originalUrl;
    
    // Always use relative URLs for health checks and API calls
    if (originalUrl.includes('gamepathai-dev-lb-1728469102.us-east-1.elb.amazonaws.com') || 
        originalUrl.includes('/health') ||
        originalUrl.includes('/api/')) {
        
      // Extract the path part from absolute URLs
      if (originalUrl.includes('http')) {
        try {
          const urlObj = new URL(originalUrl);
          url = urlObj.pathname + urlObj.search;
          console.log('✅ Converted absolute URL to relative:', originalUrl, '->', url);
        } catch (e) {
          url = originalUrl;
        }
      }
    } else {
      // For non-API URLs, just sanitize
      url = sanitizeApiUrl(originalUrl);
    }
    
    if (isMLOperation) {
      console.log('🧠 ML Fetch request to:', url);
    } else {
      console.log('🔍 Fetch request to:', url);
    }
    
    // Check for suspicious URLs that might be redirects
    if (detectRedirectAttempt(url)) {
      console.error('🚨 Blocked suspicious URL:', url);
      throw new Error('Blocked potential redirect URL: ' + url);
    }
    
    // Always add no-redirect headers to all requests
    const enhancedInit: RequestInit = {
      ...init || {},
      headers: {
        ...init?.headers || {},
        "X-No-Redirect": "1",
        "X-Requested-With": "XMLHttpRequest",
        "Cache-Control": "no-cache, no-store",
        "Pragma": "no-cache"
      },
      mode: 'cors',
      credentials: 'include',
      cache: 'no-store',
      redirect: 'error'  // Error on redirects instead of following them
    };
    
    try {
      const response = await originalFetch(url, enhancedInit);
      
      // Check if a redirect happened despite our efforts
      if (response.url && response.url !== url && response.url.includes('gamepathai.com')) {
        console.error('⚠️ Response URL indicates redirect to gamepathai.com:', response.url);
        throw new Error('Detected redirect in response: ' + response.url);
      }
      
      return response;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('redirect')) {
        console.error('❌ Redirect blocked:', url);
        throw new Error(`Redirect blocked from ${url}`);
      }
      console.error('❌ Fetch error:', error);
      throw error;
    }
  };
};

/**
 * NEW: Add a debug log to document to detect redirect attempts
 */
export const setupRedirectDetector = (): void => {
  if (typeof window === 'undefined') return;
  
  // Monitor for script injections that might cause redirects
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeName === 'SCRIPT') {
          const script = node as HTMLScriptElement;
          if (script.src && detectRedirectAttempt(script.src)) {
            console.warn('🔍 Detected suspicious script:', script.src);
            script.remove();
            console.log('✅ Removed suspicious script');
          }
        }
      });
    });
  });
  
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  
  // Monitor navigation events
  window.addEventListener('beforeunload', (event) => {
    const currentUrl = window.location.href;
    if (detectRedirectAttempt(currentUrl)) {
      event.preventDefault();
      console.error('⛔ Blocked navigation to suspicious URL:', currentUrl);
      return event.returnValue = 'Are you sure you want to leave?';
    }
  });
  
  // NEW: Add specific monitor for ML requests
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    const urlStr = typeof url === 'string' ? url : url.toString();
    
    // Sanitize the URL before proceeding
    const sanitizedUrl = sanitizeApiUrl(urlStr);
    
    if (urlStr !== sanitizedUrl) {
      console.log('✅ Sanitized XHR URL:', urlStr, '->', sanitizedUrl);
    }
    
    if (sanitizedUrl.includes('/ml/') || sanitizedUrl.includes('gamepathai.com')) {
      console.log('🔍 Monitoring ML XHR request:', sanitizedUrl);
    }
    
    return originalOpen.call(this, method, sanitizedUrl, ...args);
  };
};

/**
 * ENHANCED: Setup ML protection specifically for URLs
 * MODIFIED: Less aggressive protection in development
 */
export const setupMLProtection = (): void => {
  if (typeof window === 'undefined') return;
  
  console.log('🛡️ Setting up enhanced ML protection');
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Override XMLHttpRequest to prevent redirects
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    // Fix any absolute URLs
    let fixedUrl = url;
    
    if (typeof url === 'string') {
      // Log ML requests
      if (url.includes('/ml/')) {
        console.log('🧠 XHR ML Request:', url);
      }
      
      // Convert absolute URLs to relative for API requests
      if ((url.startsWith('http://') || url.startsWith('https://')) && 
          (url.includes('/api/') || url.includes('localhost'))) {
        
        console.log('⚠️ Found absolute URL in XHR:', url);
        fixedUrl = sanitizeApiUrl(url);
        console.log('✅ Using fixed URL:', fixedUrl);
      }
      
      // MODIFIED: Only block suspicious URLs in production
      if (!isDevelopment && detectRedirectAttempt(url)) {
        console.error('🚨 Blocked suspicious XHR URL:', url);
        throw new Error('Blocked potential redirect in XHR: ' + url);
      }
    }
    
    // Continue with the fixed URL
    return originalXHROpen.call(this, method, fixedUrl, ...args);
  };
  
  // Monitor for suspicious redirects in localStorage
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    if (
      typeof value === 'string' && 
      (value.includes('gamepathai.com') || value.includes('redirect'))
    ) {
      console.warn('⚠️ Detected suspicious localStorage operation:', key, value);
      // Continue with the operation but log it
    }
    return originalSetItem.call(this, key, value);
  };
  
  // Use event listeners to monitor navigation events without trying to override read-only properties
  window.addEventListener('click', function(event) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'A') {
      const link = target as HTMLAnchorElement;
      const href = link.href;
      
      // MODIFIED: Only block gamepathai.com links in production
      if (!isDevelopment && href && href.includes('gamepathai.com')) {
        console.error('🚨 Blocked navigation to gamepathai.com:', href);
        event.preventDefault();
      }
    }
  }, true);
  
  // Add a more robust navigation watcher
  window.addEventListener('beforeunload', function(event) {
    const currentLocation = window.location.href;
    // MODIFIED: Only block gamepathai.com navigation in production
    if (!isDevelopment && currentLocation.includes('gamepathai.com') && 
        !currentLocation.includes(window.location.hostname)) {
      console.error('🚨 Detected potential redirect to gamepathai.com');
      event.preventDefault();
      return event.returnValue = 'Navigation to external domain detected';
    }
  });
};
