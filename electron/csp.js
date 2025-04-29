
const { session } = require('electron');

/**
 * Content Security Policy configuration for Electron
 */
function setupCsp() {
  // Block ALL redirects
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = new URL(details.url);
    
    // Detect and block redirects to specific domains
    if (details.url.includes('gamepathai.com') || 
        details.url.includes('php?url=') ||
        details.url.includes('?redirect=')) {
      console.log('BLOCKED REDIRECT TO:', details.url);
      callback({cancel: true});
      return;
    }
    
    // Block any external API requests except to allowed domains
    if (details.url.includes('/api/') && 
        !details.url.includes('localhost') && 
        !details.url.includes('127.0.0.1') && 
        !url.hostname.includes('gamepathai-dev-lb-1728469102.us-east-1.elb.amazonaws.com')) {
      console.log('BLOCKED EXTERNAL API REQUEST:', details.url);
      callback({cancel: true});
      return;
    }
    
    callback({});
  });

  // Set ultra-strict CSP headers
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self';",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
          "font-src 'self' https://fonts.gstatic.com;",
          "img-src 'self' data: https://*.stripe.com https://images.unsplash.com blob:;",
          "connect-src 'self' https://*.stripe.com http://localhost:* https://localhost:* https://gamepathai-dev-lb-1728469102.us-east-1.elb.amazonaws.com wss://*.stripe.com;",
          "frame-src 'self' https://*.stripe.com;",
          "form-action 'self';",
          "base-uri 'self';",
          "frame-ancestors 'self';"
        ].join(' ')
      }
    });
  });
  
  // Log and attempt to block any redirects
  session.defaultSession.webRequest.onBeforeRedirect((details, callback) => {
    console.log('⛔ REDIRECT DETECTED:', details.redirectURL, 'from:', details.url);
    // We can't cancel here, but we log for debugging
  });
}

module.exports = { setupCsp };
