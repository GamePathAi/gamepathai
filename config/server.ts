
/**
 * Vite server configuration
 */

import { securityHeaders } from './csp';

// Define allowed hosts
export const allowedHosts = [
  'localhost', 
  '127.0.0.1',
  '*.lovableproject.com',
  '*.lovable.app',
  'db6489aa-54d3-41db-9507-31b855d86e89.lovableproject.com' // Specific Lovable project domain
];

// Configure proxy behavior
export const configureProxyMiddleware = (proxy: any, _options: any) => {
  // Add detailed logging
  proxy.on('proxyReq', (proxyReq: any, req: any, _res: any) => {
    // Add headers to prevent redirects
    proxyReq.setHeader('X-No-Redirect', '1');
    proxyReq.setHeader('X-Development-Mode', '1');
    proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
    proxyReq.setHeader('X-Forwarded-Host', req.headers.host || '');
    proxyReq.setHeader('Cache-Control', 'no-cache, no-store');
    proxyReq.setHeader('Pragma', 'no-cache');
    proxyReq.setHeader('X-GamePath-Client', 'react-frontend-dev');
    proxyReq.setHeader('X-Max-Redirects', '0');
    
    // Additional header to prevent redirects
    proxyReq.setHeader('Proxy-Used', 'vite-dev-server');
    
    // Remove headers that might aid in redirect targeting
    proxyReq.removeHeader('referer');
    proxyReq.removeHeader('origin');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 Proxy sending request to:', req.url || 'unknown URL');
    }
  });
  
  proxy.on('proxyRes', (proxyRes: any, req: any, _res: any) => {
    // Enhanced redirect detection and logging
    if (proxyRes.headers.location) {
      console.log('⛔ BLOCKED REDIRECT in proxy response:', {
        location: proxyRes.headers.location,
        from: req.url || 'unknown URL',
        statusCode: proxyRes.statusCode
      });
      
      // Save original location before blocking it
      const originalLocation = proxyRes.headers.location;
      
      // Block the redirect
      delete proxyRes.headers.location;
      
      // Add diagnostic headers
      proxyRes.headers['x-redirect-blocked'] = 'true';
      proxyRes.headers['x-original-location'] = originalLocation || '';
      proxyRes.headers['x-request-path'] = req.url || '';
    }
    
    // Set CORS headers
    proxyRes.headers['access-control-allow-origin'] = '*';
    proxyRes.headers['access-control-allow-methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE';
    proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-No-Redirect, X-ML-Operation';
    
    // Add anti-redirect headers
    proxyRes.headers['x-content-type-options'] = 'nosniff';
    proxyRes.headers['x-frame-options'] = 'DENY';
    
    if (process.env.NODE_ENV === 'development') {
      console.log('📥 Proxy received response for:', req.url || 'unknown URL', 'status:', proxyRes.statusCode);
    }
  });
  
  proxy.on('error', (err: Error) => {
    console.error('🔥 Proxy error:', err);
    console.log('⚠️ Using local mock data instead of AWS due to proxy error');
  });
};

// Configure ML proxy behavior
export const configureMLProxyMiddleware = (proxy: any) => {
  proxy.on('error', (err: Error) => {
    console.error('🔥 ML Proxy error:', err);
  });
  
  proxy.on('proxyReq', (proxyReq: any, req: any, _res: any) => {
    // Add ML-specific headers
    proxyReq.setHeader('X-No-Redirect', '1');
    proxyReq.setHeader('X-ML-Operation', '1');
    proxyReq.setHeader('X-Max-Redirects', '0');
    proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
    proxyReq.setHeader('X-GamePath-Client', 'react-frontend-dev-ml');
    proxyReq.setHeader('X-Development-Mode', '1');
    proxyReq.setHeader('Cache-Control', 'no-cache, no-store');
    proxyReq.setHeader('Pragma', 'no-cache');
    
    // Additional headers
    proxyReq.setHeader('Proxy-Used', 'vite-dev-server-ml');
    proxyReq.setHeader('X-Disable-Redirect', '1');
    
    // ML requests need longer timeouts
    proxyReq.setHeader('X-ML-Timeout', '30000');
    
    // Remove potentially problematic headers
    proxyReq.removeHeader('referer');
    proxyReq.removeHeader('origin');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🧠 ML Proxy sending request to:', req.url || 'unknown URL');
    }
  });
  
  proxy.on('proxyRes', (proxyRes: any, req: any, _res: any) => {
    // Handle ML redirects
    if (proxyRes.headers.location) {
      console.log('⛔ BLOCKED ML REDIRECT in proxy response:', {
        location: proxyRes.headers.location,
        from: req.url || 'unknown URL',
        statusCode: proxyRes.statusCode,
        contentType: proxyRes.headers['content-type'] || 'none'
      });
      
      // Store original location before removing
      const originalLocation = proxyRes.headers.location;
      delete proxyRes.headers.location;
      
      // Add diagnostic information
      proxyRes.headers['x-redirect-blocked'] = 'true';
      proxyRes.headers['x-original-location'] = originalLocation || '';
      proxyRes.headers['x-request-url'] = req.url || '';
      proxyRes.headers['x-block-reason'] = 'ML redirects not allowed';
    }
    
    // Add ML-specific response headers
    proxyRes.headers['x-ml-proxy'] = 'true';
    
    // Security headers
    proxyRes.headers['x-content-type-options'] = 'nosniff';
    proxyRes.headers['x-frame-options'] = 'DENY';
    
    // CORS headers for ML operations
    proxyRes.headers['access-control-allow-origin'] = '*';
    proxyRes.headers['access-control-allow-methods'] = 'GET,POST,OPTIONS';
    proxyRes.headers['access-control-allow-headers'] = 
      'Content-Type, Authorization, X-No-Redirect, X-ML-Operation, X-ML-Timeout';
    proxyRes.headers['access-control-max-age'] = '86400';
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🧠 ML Proxy received response for:', req.url || 'unknown URL', 
        'status:', proxyRes.statusCode);
    }
  });
};

// Configure server proxy
export const getProxyConfig = () => ({
  '/': {
    target: 'http://localhost:8081',
    changeOrigin: true,
    secure: false,
    bypass: (req: any) => {
      // Skip proxying for frontend assets
      if (
        req.url && req.url.startsWith('/assets/') || 
        req.url && req.url.startsWith('/favicon.ico') || 
        req.url && req.url.startsWith('/src/') || 
        req.url && req.url.startsWith('/images/') ||
        req.url === '/'
      ) {
        return req.url;
      }
    },
    configure: configureProxyMiddleware
  },
  '/ml': {
    target: 'http://localhost:8081/ml',
    changeOrigin: true,
    secure: false,
    rewrite: (path: string) => path.replace(/^\/ml/, ''),
    configure: configureMLProxyMiddleware
  }
});

// Create server configuration object
export const serverConfig = {
  host: "::",
  port: 8080,
  hmr: false,
  allowedHosts,
  headers: securityHeaders,
  proxy: getProxyConfig()
};
