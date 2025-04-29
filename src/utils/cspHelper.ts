
/**
 * Content Security Policy (CSP) helper
 * 
 * This utility helps maintain CSP compliance by defining policies
 * and providing functions to generate CSP headers.
 */

// Define allowed sources for different CSP directives
const CSP_SOURCES = {
  DEFAULT: ["'self'"],
  STYLE: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
  SCRIPT: ["'self'", "https://js.stripe.com", "'unsafe-inline'", "'unsafe-eval'"],
  FONT: ["'self'", "https://fonts.gstatic.com"],
  IMG: ["'self'", "data:", "https://*.stripe.com", "blob:", "https://images.unsplash.com"],
  CONNECT: [
    "'self'", 
    "https://*.stripe.com", 
    "http://localhost:*",
    "https://localhost:*",
    "https://gamepathai-dev-lb-1728469102.us-east-1.elb.amazonaws.com",
    "wss://*.stripe.com"
  ],
  FRAME: ["'self'", "https://*.stripe.com"],
  // New stricter controls
  FORM_ACTION: ["'self'"],
  BASE_URI: ["'self'"],
  FRAME_ANCESTORS: ["'self'"]
};

/**
 * Generates a CSP policy string for HTML meta tag
 */
export const generateCSPMeta = (): string => {
  return [
    `default-src ${CSP_SOURCES.DEFAULT.join(' ')};`,
    `style-src ${CSP_SOURCES.STYLE.join(' ')};`,
    `script-src ${CSP_SOURCES.SCRIPT.join(' ')};`,
    `font-src ${CSP_SOURCES.FONT.join(' ')};`,
    `img-src ${CSP_SOURCES.IMG.join(' ')};`,
    `connect-src ${CSP_SOURCES.CONNECT.join(' ')};`,
    `frame-src ${CSP_SOURCES.FRAME.join(' ')};`,
    `form-action ${CSP_SOURCES.FORM_ACTION.join(' ')};`,
    `base-uri ${CSP_SOURCES.BASE_URI.join(' ')};`,
    `frame-ancestors ${CSP_SOURCES.FRAME_ANCESTORS.join(' ')};`
  ].join(' ');
};

/**
 * Helper function to add CSP meta tag to document head
 */
export const addCSPMetaTag = (): void => {
  if (typeof document === 'undefined') return;
  
  console.log('🔒 Adding strict CSP meta tag');
  
  // Remove existing CSP meta tag if it exists
  const existingCSPMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existingCSPMeta) {
    existingCSPMeta.remove();
  }
  
  // Create and add new CSP meta tag
  const metaTag = document.createElement('meta');
  metaTag.httpEquiv = 'Content-Security-Policy';
  metaTag.content = generateCSPMeta();
  document.head.appendChild(metaTag);
  
  console.log('✅ CSP meta tag added successfully');
};

/**
 * Removes any security software injected scripts
 * that might be causing redirection issues
 */
export const removeInjectedScripts = (): void => {
  if (typeof document === 'undefined') return;
  
  console.log('🔍 Scanning for injected scripts and stylesheets...');
  
  // Find and remove any script tags from security software
  const scripts = document.querySelectorAll('script');
  let removedScripts = 0;
  scripts.forEach(script => {
    const src = script.getAttribute('src') || '';
    if (src.includes('kaspersky') || 
        src.includes('scr.kaspersky-labs.com') ||
        src.includes('kis.v2.scr') ||
        src.includes('avast') ||
        src.includes('avg') ||
        src.includes('mcafee') ||
        src.includes('norton') ||
        src.includes('webroot') ||
        src.includes('redirect') ||
        src.includes('eset')) {
      console.log('🚫 Removing potentially problematic script:', src);
      script.remove();
      removedScripts++;
    }
  });
  
  // Also check for related CSS
  const links = document.querySelectorAll('link[rel="stylesheet"]');
  let removedStyles = 0;
  links.forEach(link => {
    const href = link.getAttribute('href') || '';
    if (href.includes('kaspersky') || 
        href.includes('scr.kaspersky-labs.com') ||
        href.includes('avast') ||
        href.includes('avg') ||
        href.includes('mcafee') ||
        href.includes('norton') ||
        href.includes('webroot') ||
        href.includes('eset') ||
        href.includes('abn/main.css')) {
      console.log('🚫 Removing potentially problematic stylesheet:', href);
      link.remove();
      removedStyles++;
    }
  });
  
  // Check for suspicious iframes
  const iframes = document.querySelectorAll('iframe');
  let removedIframes = 0;
  iframes.forEach(iframe => {
    const src = iframe.getAttribute('src') || '';
    if (src.includes('gamepathai.com') || src.includes('redirect')) {
      console.log('🚫 Removing suspicious iframe:', src);
      iframe.remove();
      removedIframes++;
    }
  });
  
  console.log(`✅ Removed ${removedScripts} scripts, ${removedStyles} stylesheets, and ${removedIframes} iframes`);
};

/**
 * NEW: Helper function that can be called periodically to clean injected elements
 * This can be called on intervals to keep the page clean
 */
export const periodicCleanup = (): void => {
  removeInjectedScripts();
};
