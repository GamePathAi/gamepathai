
/**
 * URL Protection initialization module
 * Import this module early in your app startup to initialize URL protection
 */

import { UrlUtility } from "./UrlUtility";
import { detectRedirectScripts } from "./navigationMonitor";
import { setupFetchInterceptor } from "../middleware/fetchInterceptor";

/**
 * Initialize all URL protection mechanisms
 */
export const initializeUrlProtection = () => {
  console.log('🛡️ Initializing URL protection...');
  
  try {
    // Setup navigation monitor
    UrlUtility.initializeProtection();
    
    // Check for redirect scripts
    detectRedirectScripts();
    
    // Setup fetch interceptors
    setupFetchInterceptor();
    
    console.log('✅ URL protection initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize URL protection:', error);
    return false;
  }
};

// Automatically initialize URL protection in production
// In development, you may want to call this explicitly
if (process.env.NODE_ENV === 'production') {
  initializeUrlProtection();
}
