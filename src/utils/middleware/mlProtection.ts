
/**
 * Enhanced protection specifically for ML operations
 */

import { detectRedirectAttempt, sanitizeApiUrl } from '../url';

/**
 * Setup ML protection specifically for URLs
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
      
      // Only block suspicious URLs in production
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
      
      // Only block gamepathai.com links in production
      if (!isDevelopment && href && href.includes('gamepathai.com')) {
        console.error('🚨 Blocked navigation to gamepathai.com:', href);
        event.preventDefault();
      }
    }
  }, true);
  
  // Add a more robust navigation watcher
  window.addEventListener('beforeunload', function(event) {
    const currentLocation = window.location.href;
    // Only block gamepathai.com navigation in production
    if (!isDevelopment && currentLocation.includes('gamepathai.com') && 
        !currentLocation.includes(window.location.hostname)) {
      console.error('🚨 Detected potential redirect to gamepathai.com');
      event.preventDefault();
      return event.returnValue = 'Navigation to external domain detected';
    }
  });
};
