
/**
 * Browser diagnostics utilities for detecting interfering software, browser features, etc.
 */

/**
 * Check if the current browser environment might be causing redirect issues
 */
export const detectBrowserInterference = (): { 
  hasInterference: boolean; 
  details: string[] 
} => {
  const interferenceDetails: string[] = [];
  
  // Check for common extensions and behaviors
  if (typeof window !== 'undefined') {
    // Browser security extensions
    if ('KasperskyLabs' in window) {
      interferenceDetails.push('Kaspersky security suite detected');
    }
    
    // Check for ESET
    if ('ESETS_ID' in window || document.querySelector('script[src*="eset"]')) {
      interferenceDetails.push('ESET security software detected');
    }
    
    // Check for Avast/AVG
    if (document.querySelector('script[src*="avast"]') || document.querySelector('script[src*="avg"]')) {
      interferenceDetails.push('Avast/AVG antivirus detected');
    }
    
    // Check for ad blockers (common cause of fetch interference)
    const testAdElement = document.createElement('div');
    testAdElement.className = 'adsbox';
    document.body.appendChild(testAdElement);
    
    if (testAdElement.offsetHeight === 0) {
      interferenceDetails.push('Ad blocker detected');
    }
    
    document.body.removeChild(testAdElement);
    
    // Check for evidence of proxy/VPN
    try {
      const timing = performance.timing;
      if (timing && timing.connectEnd - timing.connectStart > 300) { 
        // Unusually long connection time may indicate proxy
        interferenceDetails.push('Possible proxy/VPN detected (connection timing)');
      }
    } catch (e) {
      // Timing API not available
    }
  }
  
  return {
    hasInterference: interferenceDetails.length > 0,
    details: interferenceDetails
  };
};

/**
 * Function to detect and log redirection hints in the DOM
 * This helps identify third-party scripts that might be causing redirects
 */
export const detectRedirectScripts = (): void => {
  if (typeof document === 'undefined') return;
  
  console.log('🔍 Scanning for potential redirect scripts...');
  
  // Look for suspicious script tags
  const scripts = document.querySelectorAll('script');
  scripts.forEach(script => {
    const src = script.getAttribute('src') || '';
    const content = script.textContent || '';
    
    if (src.includes('redirect') || content.includes('redirect') ||
        src.includes('forward') || content.includes('window.location') ||
        content.includes('gamepathai.com')) {
      console.warn('⚠️ Potential redirect script detected:', {
        src,
        contentSnippet: content.substring(0, 50) + (content.length > 50 ? '...' : '')
      });
    }
  });
  
  // Check for meta refresh tags
  const metas = document.querySelectorAll('meta');
  metas.forEach(meta => {
    if (meta.getAttribute('http-equiv') === 'refresh') {
      console.warn('⚠️ Meta refresh redirect detected:', meta.getAttribute('content'));
    }
  });
};

/**
 * Get information about the current connection state
 */
export const getDiagnosticInfo = () => {
  const info = {
    userAgent: navigator.userAgent,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    hasServiceWorker: 'serviceWorker' in navigator,
    hasExtensions: detectBrowserExtensions(),
    corsMode: getCorsMode(),
    referrer: document.referrer
  };
  
  return info;
};

/**
 * Attempt to detect browser extensions that might affect connections
 */
const detectBrowserExtensions = (): boolean => {
  // Look for common extension interference
  const hasExtensions = (
    // Extension DOM markers
    !!document.querySelector('div[id*="extension"]') ||
    !!document.querySelector('div[class*="extension"]') ||
    
    // Content script behavior
    window.performance?.getEntriesByType('resource')
      .some((resource) => {
        // First check if resource is a valid object
        if (resource && typeof resource === 'object') {
          // Now safely access the name property with proper type checking
          const url = 'name' in resource ? (resource.name as string) : '';
          return url.includes('chrome-extension://') || 
                 url.includes('moz-extension://') ||
                 url.includes('extension');
        }
        return false;
      }) ||
      
    // Extension prototypes (this is how we detect ad blockers)
    (typeof window !== 'undefined' && 
     'chrome' in window && 
     window.chrome && 
     'runtime' in window.chrome)
  );
  
  return hasExtensions;
};

/**
 * Get information about the current CORS mode
 */
const getCorsMode = (): string => {
  try {
    // Test if the browser blocks access to a cross-origin frame, which would be blocked in strict mode
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    // Try to access contentWindow - will fail if strict CORS
    try {
      const strictMode = !iframe.contentWindow || 
                        !iframe.contentWindow.location;
      
      document.body.removeChild(iframe);
      return strictMode ? 'strict' : 'relaxed';
    } catch (e) {
      document.body.removeChild(iframe);
      return 'strict';
    }
  } catch (e) {
    return 'unknown';
  }
};

/**
 * Check if the current site is being hosted in a sandbox
 * This can affect network connectivity
 */
export const detectSandboxEnvironment = (): boolean => {
  // Check for common sandbox indicators
  return (
    // Check iframe sandbox attribute
    (window !== window.parent) || 
    
    // Check for restricted origin
    !document.domain || 
    document.domain === "" ||
    
    // CSP restrictions
    (!!document.currentScript && document.currentScript.getAttribute('nonce') !== null) ||
    
    // Service worker blocked
    (navigator.serviceWorker && 'serviceWorker' in navigator === false)
  );
};
