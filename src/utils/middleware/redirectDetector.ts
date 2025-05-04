
/**
 * Utilities for detecting and preventing redirect attempts
 */

import { detectRedirectAttempt, sanitizeApiUrl } from '../url';

/**
 * Setup monitoring for redirect attempts in the DOM
 */
export const setupRedirectDetector = (): void => {
  if (typeof window === 'undefined') return;
  
  // Allow internal navigation to routes like /download
  const allowNavigation = (url: string): boolean => {
    // If it's a relative URL or points to the current domain, allow it
    if (url.startsWith('/') || 
        url.startsWith('#') || 
        url.includes(window.location.hostname)) {
      return true;
    }
    // Check for allowed external domains (add more as needed)
    const allowedDomains = ['localhost', '127.0.0.1'];
    return allowedDomains.some(domain => url.includes(domain));
  };
  
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
  
  // Monitor navigation events but allow internal routes
  window.addEventListener('beforeunload', (event) => {
    const currentUrl = window.location.href;
    if (detectRedirectAttempt(currentUrl) && !allowNavigation(currentUrl)) {
      event.preventDefault();
      console.error('⛔ Blocked navigation to suspicious URL:', currentUrl);
      return event.returnValue = 'Are you sure you want to leave?';
    }
  });
  
  // Add specific monitor for ML requests
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
