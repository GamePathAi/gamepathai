
/**
 * Check if the browser supports WebAuthn and handles Electron environment correctly
 */
export function isWebAuthnSupported(): boolean {
  try {
    // Check if we're in Electron - explicitly return false
    const isElectron = typeof window !== 'undefined' && 
      (window.navigator.userAgent.toLowerCase().indexOf(' electron/') > -1);

    if (isElectron) {
      console.log("Running in Electron environment, WebAuthn not supported");
      return false;
    }

    // Safety check for environments where PublicKeyCredential might not be defined
    if (typeof window === 'undefined') {
      return false;
    }
    
    // Check for PublicKeyCredential availability
    const hasWebAuthn = typeof window.PublicKeyCredential !== 'undefined';
    
    // Some browsers might have partial WebAuthn support, so let's verify more carefully
    if (hasWebAuthn) {
      // Check if isUserVerifyingPlatformAuthenticatorAvailable method exists
      if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
        return true;
      }
    }

    return hasWebAuthn;
  } catch (error) {
    console.warn("Error checking WebAuthn support:", error);
    return false;
  }
}

/**
 * Safely check if platform authenticator is available
 * Returns a Promise<boolean> that resolves to true if available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  try {
    // First check basic support
    if (!isWebAuthnSupported()) {
      return false;
    }
    
    // Then check specifically for platform authenticator
    if (typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    
    return false;
  } catch (error) {
    console.warn("Error checking for platform authenticator:", error);
    return false;
  }
}
