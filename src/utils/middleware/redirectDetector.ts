
/**
 * Utilities for detecting and preventing redirect attempts
 */

import { detectRedirectAttempt, sanitizeApiUrl } from '../url';

/**
 * Setup monitoring for redirect attempts in the DOM
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
