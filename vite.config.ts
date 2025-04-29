
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: process.env.IS_ELECTRON === 'true' ? './' : '/',
  define: {
    // Define global variables
    'process.env.IS_ELECTRON': process.env.IS_ELECTRON || 'false',
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  server: {
    host: "::",
    port: 8080,
    // Force disable HMR (Hot Module Replacement) to prevent redirects
    hmr: false,
    proxy: {
      // Enhanced proxy configuration to prevent redirects
      '/api': {
        target: 'https://gamepathai-dev-lb-1728469102.us-east-1.elb.amazonaws.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('🔥 Proxy error:', err);
          });
          
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // MELHORADO: Adicionar cabeçalhos robustos anti-redirecionamento
            proxyReq.setHeader('X-No-Redirect', '1');
            proxyReq.setHeader('X-Development-Mode', '1');
            proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
            proxyReq.setHeader('X-Forwarded-Host', req.headers.host || '');
            proxyReq.setHeader('Cache-Control', 'no-cache, no-store');
            proxyReq.setHeader('Pragma', 'no-cache');
            proxyReq.setHeader('X-GamePath-Client', 'react-frontend-dev');
            proxyReq.setHeader('X-Max-Redirects', '0');
            
            // NOVO: Adicionar cabeçalho para impedir redirecionamentos na origem
            proxyReq.setHeader('Proxy-Used', 'vite-dev-server');
            
            // Remove headers that might aid in redirect targeting
            proxyReq.removeHeader('referer');
            proxyReq.removeHeader('origin');
            
            // Verificar se é uma operação ML e adicionar tratamento especial
            if (req.url?.includes('/ml/')) {
              console.log('📤 Enviando requisição ML:', req.url);
              proxyReq.setHeader('X-ML-Operation', '1');
            }
            
            if (mode === 'development') {
              console.log('📤 Proxy sending request to:', req.url);
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // MELHORADO: Detecção e log mais detalhados de redirecionamentos
            if (proxyRes.headers.location) {
              console.log('⛔ BLOCKED REDIRECT in proxy response:', {
                location: proxyRes.headers.location,
                from: req.url,
                statusCode: proxyRes.statusCode
              });
              
              // NOVO: Registrar detalhes completos do redirecionamento antes de bloqueá-lo
              const originalLocation = proxyRes.headers.location;
              
              // Bloquear o redirecionamento removendo o cabeçalho
              delete proxyRes.headers.location;
              
              // Adicionar cabeçalhos personalizados para informar que um redirecionamento foi bloqueado
              proxyRes.headers['x-redirect-blocked'] = 'true';
              proxyRes.headers['x-original-location'] = originalLocation || '';
              proxyRes.headers['x-request-path'] = req.url || '';
            }
            
            // Ensure CORS headers are properly set
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE';
            proxyRes.headers['access-control-allow-headers'] = 'Content-Type, Authorization, X-No-Redirect, X-ML-Operation';
            
            // Add anti-redirect headers to responses
            proxyRes.headers['x-content-type-options'] = 'nosniff';
            proxyRes.headers['x-frame-options'] = 'DENY';
            
            // Set strict CSP headers directly in proxy response
            proxyRes.headers['content-security-policy'] = [
              "default-src 'self';",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com;",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
              "font-src 'self' https://fonts.gstatic.com;",
              "img-src 'self' data: https://*.stripe.com https://images.unsplash.com blob:;",
              "connect-src 'self' https://*.stripe.com http://localhost:* https://localhost:* https://gamepathai-dev-lb-1728469102.us-east-1.elb.amazonaws.com wss://*.stripe.com;",
              "frame-src 'self' https://*.stripe.com;"
            ].join(' ');
            
            if (mode === 'development') {
              console.log('📥 Proxy received response for:', req.url, 'status:', proxyRes.statusCode);
              
              // NOVO: Log detalhado para diagnóstico
              console.log('Response headers:', {
                contentType: proxyRes.headers['content-type'],
                redirectBlocked: proxyRes.headers['x-redirect-blocked'] || 'no',
                cors: proxyRes.headers['access-control-allow-origin'] || 'not set'
              });
            }
          });
        }
      },
      // Special proxy configuration for ML operations with enhanced logging and redirect prevention
      '/api/ml': {
        target: 'https://gamepathai-dev-lb-1728469102.us-east-1.elb.amazonaws.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/ml/, '/api/ml'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('🔥 ML Proxy error:', err);
          });
          
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // MELHORADO: Cabeçalhos ML específicos mais robustos
            proxyReq.setHeader('X-No-Redirect', '1');
            proxyReq.setHeader('X-ML-Operation', '1');
            proxyReq.setHeader('X-Max-Redirects', '0');
            proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
            proxyReq.setHeader('X-GamePath-Client', 'react-frontend-dev-ml');
            proxyReq.setHeader('X-Development-Mode', '1');
            proxyReq.setHeader('Cache-Control', 'no-cache, no-store');
            proxyReq.setHeader('Pragma', 'no-cache');
            
            // NOVO: Cabeçalhos adicionais para prevenção de redirecionamento
            proxyReq.setHeader('Proxy-Used', 'vite-dev-server-ml');
            proxyReq.setHeader('X-Disable-Redirect', '1');
            
            // ML requests need longer timeouts
            proxyReq.setHeader('X-ML-Timeout', '30000');
            
            // Remove potentially problematic headers
            proxyReq.removeHeader('referer');
            proxyReq.removeHeader('origin');
            
            if (mode === 'development') {
              console.log('🧠 ML Proxy sending request to:', req.url);
              // NOVO: Log mais detalhado
              console.log('ML Request headers:', {
                'X-ML-Operation': '1',
                'X-No-Redirect': '1',
                'X-Max-Redirects': '0',
                url: req.url,
                method: req.method
              });
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            // MELHORADO: Detecção mais detalhada de redirecionamentos em ML
            if (proxyRes.headers.location) {
              console.log('⛔ BLOCKED ML REDIRECT in proxy response:', {
                location: proxyRes.headers.location,
                from: req.url,
                statusCode: proxyRes.statusCode,
                contentType: proxyRes.headers['content-type'] || 'none'
              });
              
              // Armazenar a localização original antes de removê-la
              const originalLocation = proxyRes.headers.location;
              delete proxyRes.headers.location;
              
              // Adicionar informações de diagnóstico
              proxyRes.headers['x-redirect-blocked'] = 'true';
              proxyRes.headers['x-original-location'] = originalLocation || '';
              proxyRes.headers['x-request-url'] = req.url || '';
              proxyRes.headers['x-block-reason'] = 'ML redirects not allowed';
            }
            
            // Add ML-specific response headers
            proxyRes.headers['x-ml-proxy'] = 'true';
            
            // Standard security headers
            proxyRes.headers['x-content-type-options'] = 'nosniff';
            proxyRes.headers['x-frame-options'] = 'DENY';
            
            // CORS headers for ML operations
            proxyRes.headers['access-control-allow-origin'] = '*';
            proxyRes.headers['access-control-allow-methods'] = 'GET,POST,OPTIONS';
            proxyRes.headers['access-control-allow-headers'] = 
              'Content-Type, Authorization, X-No-Redirect, X-ML-Operation, X-ML-Timeout';
            proxyRes.headers['access-control-max-age'] = '86400';
            
            if (mode === 'development') {
              console.log('🧠 ML Proxy received response for:', req.url, 
                'status:', proxyRes.statusCode);
              
              // Log more details for debug
              const contentType = proxyRes.headers['content-type'];
              if (contentType) {
                console.log(`🧠 ML Response content-type: ${contentType}`);
              }
              
              // NOVO: Log mais detalhado para diagnóstico de ML
              console.log('ML Response headers:', {
                contentType: proxyRes.headers['content-type'],
                redirectBlocked: proxyRes.headers['x-redirect-blocked'] || 'no',
                cors: proxyRes.headers['access-control-allow-origin'] || 'not set',
                mlProxy: proxyRes.headers['x-ml-proxy'] || 'not set'
              });
            }
          });
        }
      }
    }
  }
}));
