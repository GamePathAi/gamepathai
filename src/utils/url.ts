/**
 * URL manipulation and security checks
 */

import { getApiBaseUrl } from './url/apiBaseUrl';

/**
 * Detect redirect attempts based on URL patterns
 */
export const detectRedirectAttempt = (url: string): boolean => {
  if (typeof url !== 'string') return false;
  
  // Common redirect patterns
  return (
    url.includes('gamepathai.com') ||
    url.includes('php?url=') ||
    url.includes('?url=') ||
    url.includes('&url=') ||
    url.includes('?redirect=') ||
    url.includes('&redirect=') ||
    url.includes('redirect.php') ||
    url.includes('/redirect/') ||
    url.includes('go.php?') ||
    url.includes('kaspersky') ||
    url.includes('avast')
  );
};

/**
 * Sanitize API URLs by making sure they are relative or safe domains
 */
export const sanitizeApiUrl = (url: string): string => {
  if (typeof url !== 'string') return '';
  
  // Already relative - just return
  if (url.startsWith('/')) {
    return url;
  }
  
  try {
    // For absolute URLs, extract just the path if it's pointing to API or known endpoints
    if (url.includes('http')) {
      const urlObj = new URL(url);
      
      // Check if this is our API or a health check endpoint
      if (urlObj.pathname.includes('/api/') || 
          urlObj.pathname.includes('/health')) {
          
        return urlObj.pathname + urlObj.search;
      }
      
      // For recognized hosts, keep the URL
      if (urlObj.hostname.includes('localhost') || 
          urlObj.hostname.endsWith('gamepathai-dev-lb-1728469102.us-east-1.elb.amazonaws.com')) {
        return url;
      }
      
      // Block suspicious domains with gamepathai.com
      if (urlObj.hostname.includes('gamepathai.com')) {
        console.error('🚨 Blocked suspicious domain:', url);
        return '/';
      }
    }
  } catch (e) {
    console.error('⚠️ Error sanitizing URL:', url, e);
  }
  
  return url;
};

/**
 * Fix absolute URLs to be relative when appropriate
 */
export const fixAbsoluteUrl = (url: string): string => {
  if (typeof url !== 'string') return '';
  
  if (url.includes('/api/') || url.includes('/health')) {
    try {
      if (url.startsWith('http')) {
        const urlObj = new URL(url);
        return urlObj.pathname + urlObj.search;
      }
    } catch (e) {
      // If parsing fails, return the original URL
      console.error('⚠️ Error fixing absolute URL:', url);
    }
  }
  
  return url;
};

/**
 * Detect and warn about redirect scripts injected in the page
 */
export const detectRedirectScripts = (): boolean => {
  if (typeof document === 'undefined') return false;
  
  // Check for suspicious script tags
  const scripts = document.querySelectorAll('script');
  let found = false;
  
  scripts.forEach(script => {
    const src = script.getAttribute('src') || '';
    const content = script.textContent || '';
    
    if (
      src.includes('redirect') || 
      src.includes('gamepathai.com') ||
      content.includes('window.location') || 
      content.includes('redirect')
    ) {
      console.warn('🔍 Detected suspicious script:', src || '[inline script]');
      found = true;
    }
  });
  
  return found;
};

/**
 * Setup monitoring for navigation changes
 */
export const setupNavigationMonitor = (): void => {
  if (typeof window === 'undefined') return;
  
  // Monitor navigation events
  window.addEventListener('beforeunload', (event) => {
    const currentUrl = window.location.href;
    if (currentUrl.includes('gamepathai.com') && !currentUrl.includes(window.location.hostname)) {
      console.error('⛔ Blocked navigation to suspicious URL:', currentUrl);
      event.preventDefault();
      return event.returnValue = 'Navigation to external domain detected';
    }
  });
  
  // Override a few key browser APIs for added protection
  try {
    // Store original methods
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    // Override pushState
    history.pushState = function(state, title, url) {
      if (url && typeof url === 'string' && detectRedirectAttempt(url)) {
        console.error('🚨 Blocked suspicious pushState URL:', url);
        return;
      }
      return originalPushState.call(this, state, title, url);
    };
    
    // Override replaceState
    history.replaceState = function(state, title, url) {
      if (url && typeof url === 'string' && detectRedirectAttempt(url)) {
        console.error('🚨 Blocked suspicious replaceState URL:', url);
        return;
      }
      return originalReplaceState.call(this, state, title, url);
    };
  } catch (e) {
    console.error('⚠️ Could not override history methods:', e);
  }
};

// Export the getApiBaseUrl function directly from url.ts
export { getApiBaseUrl };
