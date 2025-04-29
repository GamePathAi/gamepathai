// Importing our URL redirection utilities
import { getApiBaseUrl, isElectron, isTrustedDevelopmentEnvironment } from "../utils/urlRedirects";

// Configure API base URL - always use proxy
const API_BASE_URL = getApiBaseUrl();

// Remove noisy logging and only log in development
const isDev = process.env.NODE_ENV === 'development';
if (isDev) {
  console.log("API_BASE_URL sendo usado:", API_BASE_URL);
}

export const apiClient = {
  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Ensure endpoint starts with / for proper URL joining
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // Clean endpoint: remove any duplicate /api/ patterns that might exist
    const cleanedEndpoint = formattedEndpoint
      .replace(/\/api\/api\//g, '/api/')  // Replace "/api/api/" with "/api/"
      .replace(/^\/api\/api$/, '/api');   // Handle edge case
    
    // Build the final URL ensuring only one /api/ prefix
    let url = API_BASE_URL;
    if (cleanedEndpoint.startsWith('/api') && API_BASE_URL.endsWith('/api')) {
      // If both have /api, use the path after /api from cleanedEndpoint
      url += cleanedEndpoint.substring(4); // Skip the '/api' part
    } else {
      url += cleanedEndpoint;
    }
    
    // MELHORADO: verificar e logar se o URL contém localhost absoluto
    if (url.includes('http://localhost') || url.includes('https://localhost') || 
        url.includes('127.0.0.1')) {
      console.warn('⚠️ URL absoluto com localhost detectado:', url);
      // Substituir por URL relativo para usar o proxy do Vite
      url = url.replace(/https?:\/\/localhost(:\d+)?/g, '');
      url = url.replace(/https?:\/\/127\.0\.0\.1(:\d+)?/g, '');
      console.log('✅ URL corrigido para usar proxy:', url);
    }
    
    const headers = {
      "Content-Type": "application/json",
      "X-No-Redirect": "1", // Prevent redirects
      "X-Client-Source": "react-frontend", // Identifica origem da requisição
      "Cache-Control": "no-cache, no-store", // Prevent caching
      "Pragma": "no-cache",
      // NOVO: Adicionar cabeçalhos anti-redirecionamento
      "X-Max-Redirects": "0",
      "X-Requested-With": "XMLHttpRequest",
      ...(options.headers || {})
    };
    
    // Adicionar cabeçalho para ambiente de desenvolvimento
    if (isDev || isTrustedDevelopmentEnvironment()) {
      headers["X-Development-Mode"] = "1";
    }
    
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    try {
      if (isDev) {
        console.log(`📡 Fazendo requisição para: ${url}`);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      // Conjunto avançado de opções para fetch
      const fetchOptions: RequestInit = {
        ...options,
        headers,
        mode: 'cors',
        credentials: 'include',
        cache: 'no-store',
        redirect: 'error', // CRITICAL: Treat redirects as errors
        signal: controller.signal
      };
      
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      // MELHORADO: Verificação mais rigorosa de redirecionamentos
      if (response.url && response.url !== url) {
        // Verifique se há qualquer mudança de origem ou domínio
        const originalUrl = new URL(url, window.location.origin);
        const redirectedUrl = new URL(response.url, window.location.origin);
        
        if (originalUrl.host !== redirectedUrl.host || 
            redirectedUrl.href.includes('gamepathai.com')) {
          console.error('⚠️ Detectado redirecionamento na resposta:', {
            original: url,
            redirected: response.url
          });
          throw new Error(`Detected redirect to ${response.url}`);
        }
      }
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log("Token expirado, tentando renovar...");
          const renewed = await tryRenewToken();
          
          if (renewed) {
            return apiClient.fetch<T>(endpoint, options);
          }
        }
        
        // Check if response is HTML instead of JSON (likely a redirect or error page)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw {
            status: response.status,
            message: 'Received HTML response when expecting JSON. Possible redirect or server error.',
            isHtmlResponse: true
          };
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          ...errorData
        };
      }
      
      // Check if response is HTML instead of expected JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (contentType && contentType.includes('text/html')) {
          throw {
            status: 'error',
            message: 'Received HTML response when expecting JSON. Possible redirect or server error.',
            isHtmlResponse: true
          };
        }
      }
      
      return response.json() as Promise<T>;
    } catch (error: any) {
      console.error(`❌ Falha na requisição para ${endpoint}:`, error);
      
      // Verificar se o erro é relacionado a redirecionamento
      if (error.message && 
         (error.message.includes('redirect') || error.message.includes('gamepathai.com'))) {
        console.error('🚨 REDIRECIONAMENTO DETECTADO E BLOQUEADO');
        // Registre informações de diagnóstico
        console.error('Detalhes da requisição:', { url, endpoint, headers: options.headers });
      }
      
      throw {
        status: 'error',
        message: 'Falha ao buscar dados do servidor',
        originalError: error
      };
    }
  }
};

// Função para tentar renovar o token
async function tryRenewToken() {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;
    
    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-No-Redirect": "1", // Prevent redirects
        "Cache-Control": "no-cache" // Prevent caching
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      mode: 'cors',
      credentials: 'include',
      cache: 'no-store'
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    localStorage.setItem("auth_token", data.access_token);
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }
    
    return true;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}

// Função para testar a conexão com o backend
export const testBackendConnection = async () => {
  try {
    // Make sure we use a clean path without duplicated /api/
    const url = `${API_BASE_URL}/health`.replace(/\/api\/api\//g, '/api/');
    
    if (isDev) {
      console.log("Testando conexão com:", url);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
    
    const response = await fetch(url, { 
      mode: 'cors',
      headers: {
        "Accept": "application/json",
        "X-No-Redirect": "1", // Prevent redirects
        "Cache-Control": "no-cache", // Prevent caching
        "X-Development-Mode": isDev ? "1" : "0",
        // NOVO: Adicionar cabeçalhos anti-redirecionamento
        "X-Max-Redirects": "0",
        "X-Requested-With": "XMLHttpRequest"
      },
      signal: controller.signal,
      cache: 'no-store',
      redirect: 'error' // Tratar redirecionamentos como erros
    });
    
    clearTimeout(timeoutId);
    
    // MELHORADO: Verificação mais rigorosa de redirecionamentos
    if (response.url && response.url !== url) {
      const originalUrl = new URL(url, window.location.origin);
      const redirectedUrl = new URL(response.url, window.location.origin);
      
      if (originalUrl.host !== redirectedUrl.host || 
          redirectedUrl.href.includes('gamepathai.com')) {
        console.error('⚠️ Redirecionamento detectado no teste de conexão:', {
          original: url,
          redirected: response.url
        });
        return false;
      }
    }
    
    if (isDev) {
      console.log(`Backend connection ${response.ok ? 'successful' : 'failed'} with status: ${response.status}`);
    }
    
    return response.ok;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("Backend connection test timed out");
    } else {
      console.error("Backend connection test failed:", error);
    }
    return false;
  }
};