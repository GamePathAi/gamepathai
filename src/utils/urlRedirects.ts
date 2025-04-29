
/**
 * URL redirector utility for handling different environments
 * ENHANCED: Additional protection for ML operations
 */

// Domain configurations
export const DOMAINS = {
  PRODUCTION: 'gamepathai.com',
  LOCAL_DEVELOPMENT: 'localhost:8080', // Port 8080 for Vite
  AWS_BACKEND: 'gamepathai-dev-lb-1728469102.us-east-1.elb.amazonaws.com'
};

// ML-specific domains that should be trusted
export const ML_DOMAINS = {
  ML_SERVICE: 'ml-api.gamepathai.com',
  ML_FALLBACK: 'ml-service-fallback.gamepathai.com',
  // Adicionar domínios de desenvolvimento como confiáveis
  ML_DEV: 'localhost:8080'
};

/**
 * Checks if the application is running in the production environment
 */
export const isProduction = (): boolean => {
  return typeof window !== 'undefined' && 
         window.location.hostname === DOMAINS.PRODUCTION;
};

/**
 * Checks if the application is running in Electron
 */
export const isElectron = (): boolean => {
  // Verify if running in Electron
  return typeof window !== 'undefined' && 
         window.navigator.userAgent.toLowerCase().indexOf(' electron/') > -1;
};

/**
 * Gets the appropriate base URL for API calls based on environment
 * ENHANCED: Special handling for ML operations
 */
export const getApiBaseUrl = (isMlOperation = false): string => {
  // Debug URL usage to detect potential redirect issues
  if (isMlOperation) {
    console.log('🧠 Using ML API proxy: /api/ml');
  } else {
    console.log('🔒 Using local API proxy: /api');
  }
  
  // Force using the local proxy to prevent any redirections
  return isMlOperation ? '/api/ml' : '/api';
};

/**
 * COMPLETELY DISABLED: No URL mapping to production
 * ENHANCED: Special handling for ML operations
 */
export const mapToProdUrl = (url: string, isMlOperation = false): string => {
  // Log the attempt with additional context for ML operations
  if (isMlOperation) {
    console.log('⛔ Blocked attempt to map ML URL to production:', url);
  } else {
    console.log('⛔ Blocked attempt to map URL to production:', url);
  }
  
  // Always return original URL - never redirect
  return url;
};

/**
 * Detect potential redirect attempts in URLs
 * ENHANCED: Special protection for ML endpoints and development exclusions
 */
export const detectRedirectAttempt = (url: string, isMlOperation = false): boolean => {
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // NOVO: Verificar se o URL já é um proxy local, que não precisa ser bloqueado
  if ((url.startsWith('/api') || url.startsWith('/api/ml')) && 
      !url.includes('http:') && !url.includes('https:')) {
    return false; // Proxy local é seguro, não bloquear
  }
  
  // Check for obvious patterns
  const suspicious = url.includes('gamepathai.com') || 
                    url.includes('redirect=') ||
                    url.includes('php?url=') ||
                    url.includes('?url=') ||
                    url.includes('&url=') ||
                    // Additional patterns for more aggressive detection
                    url.includes('redir') ||
                    url.includes('forward=') ||
                    url.includes('go=http');
  
  // MODIFICADO: Special extra checks for ML operations which are more sensitive
  // Em desenvolvimento, não considere localhost como suspeito
  const mlSuspicious = isMlOperation && (
    // Se estiver em desenvolvimento, NÃO considere localhost como suspeito
    (!isDevelopment && url.includes('localhost')) ||
    (!url.includes('/api/ml/') && url.includes('/ml/')) // ML operations should always go through /api/ml/
  );
  
  if (suspicious || mlSuspicious) {
    if (isDevelopment && url.includes('localhost')) {
      // Em desenvolvimento, permitir URLs de localhost mesmo que pareçam suspeitos
      console.log('⚠️ Permitindo URL de desenvolvimento que seria bloqueado em produção:', url);
      return false;
    }
    
    if (isMlOperation) {
      console.error('🚨 POTENTIAL ML REDIRECT DETECTED:', url);
    } else {
      console.error('🚨 POTENTIAL REDIRECT DETECTED:', url);
    }
    return true;
  }
  
  return false;
};

/**
 * Special function to validate ML endpoint URLs
 * Ensures they follow the expected pattern
 */
export const validateMlEndpoint = (endpoint: string): boolean => {
  // ML endpoints should always follow these patterns
  const validPatterns = [
    /^\/api\/ml\//,
    /^\/ml\//
  ];
  
  // If it matches any valid pattern, it's valid
  if (validPatterns.some(pattern => pattern.test(endpoint))) {
    return true;
  }
  
  console.error('🚨 Invalid ML endpoint format:', endpoint);
  return false;
};

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
 * Check if we're in a trusted development environment
 */
export const isTrustedDevelopmentEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  // Check if we're in localhost with expected dev ports
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Common development ports (Vite, React, etc)
    if (port === '8080' || port === '3000' || port === '5173' || port === '') {
      return true;
    }
  }
  
  return false;
};

/**
 * Logs detailed information about a redirect attempt for diagnostics
 */
export const logRedirectAttempt = (originalUrl: string, redirectUrl: string, context?: string): void => {
  console.warn(`
⚠️ REDIRECT ATTEMPT DETECTED:
   - Original URL: ${originalUrl}
   - Redirect URL: ${redirectUrl}
   - Context: ${context || 'unknown'}
   - Time: ${new Date().toISOString()}
   - User Agent: ${navigator.userAgent}
   - Development: ${process.env.NODE_ENV === 'development' ? 'Yes' : 'No'}
  `);
  
  // In a real implementation, you might want to send this information to your server
  // for tracking and troubleshooting purposes
};
