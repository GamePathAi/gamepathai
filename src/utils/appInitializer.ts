
import { setupFetchInterceptor, setupRedirectDetector, setupMLProtection } from './middleware';
import { addCSPMetaTag, removeInjectedScripts, periodicCleanup } from './cspHelper';

/**
 * Report ML-related issues to the console for debugging
 */
export const reportMLIssue = (issue: string, details?: any): void => {
  console.error(`🚨 ML Issue: ${issue}`, details || '');
};

/**
 * Initialize application with security measures and protections
 */
export const initializeApp = (): void => {
  if (typeof window === 'undefined') return;
  
  console.log('🚀 GamePath AI: Initializing application security...');
  
  try {
    // Setup fetch interceptor to prevent unwanted redirects
    setupFetchInterceptor();
    
    // Setup redirect detector to prevent unwanted redirects via DOM mutations
    setupRedirectDetector();
    
    // Add CSP meta tag for browsers that don't support CSP headers
    addCSPMetaTag();
    
    // Clean injected scripts from security software
    removeInjectedScripts();
    
    // Setup ML protection
    setupMLProtection();
    
    console.log('✅ GamePath AI: Application security initialized successfully');
  } catch (error) {
    console.error('❌ GamePath AI: Error initializing application security:', error);
  }
};
