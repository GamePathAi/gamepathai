
/**
 * Specialized API client for Machine Learning operations
 * Includes specific configurations to prevent redirects and handle ML-specific requirements
 */
import { toast } from "sonner";
import { detectRedirectAttempt, isTrustedDevelopmentEnvironment } from "../utils/urlRedirects";

// Constants for ML operations
export const ML_API_CONFIG = {
  TIMEOUT_MS: 30000, // 30 seconds timeout for ML operations
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY_MS: 2000,
  MODELS: {
    ROUTE_OPTIMIZER: 'route-optimizer',
    PERFORMANCE_PREDICTOR: 'performance-predictor',
    GAME_DETECTION: 'game-detection'
  },
  DEV_MODE: process.env.NODE_ENV === 'development'
};

// Custom error for ML operations
export class MLApiError extends Error {
  status?: number;
  endpoint?: string;
  modelType?: string;

  constructor(message: string, options: { status?: number, endpoint?: string, modelType?: string } = {}) {
    super(message);
    this.name = 'MLApiError';
    this.status = options.status;
    this.endpoint = options.endpoint;
    this.modelType = options.modelType;
  }
}

/**
 * ML API client with specialized configuration for machine learning operations
 */
export const mlApiClient = {
  /**
   * Make a fetch request specifically configured for ML operations
   * Blocks redirects and handles ML-specific errors
   */
  async fetch<T>(endpoint: string, options: RequestInit = {}, modelType: string): Promise<T> {
    // Ensure endpoint starts with / for proper URL joining
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // MELHORADO: Garantir que sempre use o proxy local
    const url = formattedEndpoint.startsWith('/api') ? formattedEndpoint : `/api${formattedEndpoint}`;
    
    console.log(`🧠 ML API Request [${modelType}]: ${url}`);
    
    // Check for suspicious URLs that might be redirects
    if (detectRedirectAttempt(url, true)) {
      console.error(`🚨 Blocked suspicious ML API URL: ${url}`);
      throw new MLApiError('Blocked potentially malicious URL', { endpoint, modelType });
    }
    
    // MELHORADO: ML-specific headers
    const headers = {
      "Content-Type": "application/json",
      "X-No-Redirect": "1", // Prevent redirects
      "X-ML-Operation": "1", // Mark as ML operation
      "X-Max-Redirects": "0", // Explicitly prevent redirects
      "X-ML-Model": modelType,
      "Cache-Control": "no-cache, no-store", 
      "Pragma": "no-cache",
      "X-GamePath-Client": "react-frontend", // Identify client
      "X-Requested-With": "XMLHttpRequest", // NOVO: Identificar como AJAX
      ...(options.headers || {})
    };
    
    // Add development mode header in dev environment
    if (ML_API_CONFIG.DEV_MODE || isTrustedDevelopmentEnvironment()) {
      headers["X-Development-Mode"] = "1";
    }
    
    // Add authentication if available
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log(`⏱️ ML operation timeout for ${modelType}`);
    }, ML_API_CONFIG.TIMEOUT_MS);
    
    try {
      // MELHORADO: Verificar redirecionamentos no URL de origem
      if (url.includes('http://localhost') || url.includes('https://localhost') || 
          url.includes('127.0.0.1')) {
        console.warn('⚠️ ML URL absoluto com localhost detectado:', url);
        // Substituir por URL relativo para usar o proxy do Vite
        const cleanUrl = url
          .replace(/https?:\/\/localhost(:\d+)?/g, '')
          .replace(/https?:\/\/127\.0\.0\.1(:\d+)?/g, '');
        console.log('✅ ML URL corrigido para usar proxy:', cleanUrl);
      }
      
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
        mode: 'cors',
        credentials: 'include',
        cache: 'no-store',
        redirect: 'error', // CRUCIAL: treat redirects as errors to prevent them
      });
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Check response URL for evidence of redirect that slipped through
      if (response.url && response.url !== url) {
        // MELHORADO: Verificação mais rigorosa de redirecionamentos
        const originalUrl = new URL(url, window.location.origin);
        const redirectedUrl = new URL(response.url, window.location.origin);
        
        if (originalUrl.host !== redirectedUrl.host || 
            redirectedUrl.href.includes('gamepathai.com')) {
          console.error('⚠️ Detected redirect in ML response URL:', {
            original: url,
            redirected: response.url
          });
          
          toast.error('Detecção de redirecionamento', {
            description: 'Um redirecionamento ML foi detectado e bloqueado'
          });
          
          throw new MLApiError('Detected redirect in response', { 
            endpoint, 
            modelType,
            status: 302 
          });
        }
      }
      
      if (!response.ok) {
        // Handle specific error statuses
        if (response.status === 429) {
          throw new MLApiError('ML system is currently overloaded, please try again later', { 
            status: response.status,
            endpoint,
            modelType
          });
        }
        
        const contentType = response.headers.get('content-type');
        // Check if response is HTML instead of JSON (likely a redirect page)
        if (contentType && contentType.includes('text/html')) {
          console.error('🚨 Received HTML response when expecting JSON in ML operation');
          throw new MLApiError('Received HTML instead of JSON data, possible redirect', {
            status: response.status,
            endpoint,
            modelType
          });
        }
        
        // Try to parse error message from response
        const errorData = await response.json().catch(() => ({}));
        throw new MLApiError(errorData.message || 'Error in ML operation', {
          status: response.status,
          endpoint,
          modelType,
        });
      }
      
      // Verify that the content type is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('⚠️ ML API response is not JSON:', contentType);
        throw new MLApiError('Invalid response format from ML service', { endpoint, modelType });
      }
      
      // Parse and return JSON data
      const data = await response.json();
      console.log(`✅ ML API ${modelType} operation successful:`, endpoint);
      
      // Log resumo dos dados recebidos (sem informações sensíveis)
      if (ML_API_CONFIG.DEV_MODE) {
        console.log(`ML ${modelType} resposta:`, {
          success: data.success,
          dataType: typeof data,
          hasOptimizations: data.optimizations ? 'sim' : 'não',
          responseKeys: Object.keys(data)
        });
      }
      
      return data as T;
    } catch (error: any) {
      // Clear timeout if still active
      clearTimeout(timeoutId);
      
      // Special handling for abort (timeout)
      if (error.name === 'AbortError') {
        throw new MLApiError(`ML operation timed out after ${ML_API_CONFIG.TIMEOUT_MS / 1000}s`, { 
          endpoint,
          modelType
        });
      }
      
      // If the error is already an MLApiError, just rethrow it
      if (error instanceof MLApiError) {
        throw error;
      }
      
      // MELHORADO: Detecção mais detalhada de erros de redirecionamento
      if (error.message && (
        error.message.includes('redirect') || 
        error.message.includes('gamepathai.com') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('Network request failed')
      )) {
        console.error('🚨 ML API redirect blocked:', error.message);
        console.log('Detalhes do erro de redirecionamento:', {
          url,
          endpoint,
          modelType,
          message: error.message
        });
        
        toast.error('Redirecionamento bloqueado', {
          description: 'Uma tentativa de redirecionamento foi detectada e bloqueada'
        });
        
        throw new MLApiError('ML request was redirected and blocked for security', {
          endpoint,
          modelType
        });
      }
      
      // Generic network error
      console.error(`❌ ML API ${modelType} request failed:`, error);
      throw new MLApiError(error.message || 'Failed to connect to ML service', {
        endpoint,
        modelType
      });
    }
  },
  
  /**
   * Create a retry wrapper for ML operations that may sometimes fail
   */
  async withRetry<T>(operation: () => Promise<T>, options: {
    retries?: number,
    delayMs?: number,
    modelType: string,
    endpoint: string
  }): Promise<T> {
    const retries = options.retries || ML_API_CONFIG.RETRY_ATTEMPTS;
    const delayMs = options.delayMs || ML_API_CONFIG.RETRY_DELAY_MS;
    
    try {
      return await operation();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }
      
      console.log(`🔄 Retrying ML operation [${options.modelType}] after ${delayMs}ms...`);
      // Wait for specified delay
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      // Try again with one less retry
      return this.withRetry(operation, {
        ...options,
        retries: retries - 1
      });
    }
  }
};

/**
 * ML service handlers for specific machine learning models
 */
export const mlService = {
  /**
   * Route optimizer model: Analyzes and optimizes network routes for games
   */
  optimizeRoutes: async (gameId: string, params: {
    region?: string,
    aggressiveness?: 'low' | 'medium' | 'high'
  } = {}) => {
    return mlApiClient.withRetry(
      () => mlApiClient.fetch<{
        success: boolean,
        optimizedRoutes: number,
        latencyReduction: number,
        settings: Record<string, any>
      }>(
        `/ml/route-optimizer/${gameId}`,
        {
          method: 'POST',
          body: JSON.stringify(params),
        },
        ML_API_CONFIG.MODELS.ROUTE_OPTIMIZER
      ),
      {
        modelType: ML_API_CONFIG.MODELS.ROUTE_OPTIMIZER,
        endpoint: `/ml/route-optimizer/${gameId}`
      }
    );
  },
  
  /**
   * Performance predictor model: Predicts optimal settings for games
   */
  predictPerformance: async (gameId: string, systemSpecs: any) => {
    return mlApiClient.withRetry(
      () => mlApiClient.fetch<{
        recommendedSettings: Record<string, any>,
        expectedFps: number,
        confidence: number
      }>(
        `/ml/performance-predictor/${gameId}`,
        {
          method: 'POST',
          body: JSON.stringify({ systemSpecs }),
        },
        ML_API_CONFIG.MODELS.PERFORMANCE_PREDICTOR
      ),
      {
        modelType: ML_API_CONFIG.MODELS.PERFORMANCE_PREDICTOR,
        endpoint: `/ml/performance-predictor/${gameId}`
      }
    );
  },
  
  /**
   * Game detection model: Detects installed games and their state
   */
  detectGames: async () => {
    return mlApiClient.withRetry(
      () => mlApiClient.fetch<{
        detectedGames: Array<{
          id: string,
          name: string,
          path: string,
          lastPlayed?: Date,
          version?: string
        }>
      }>(
        '/ml/game-detection',
        { method: 'GET' },
        ML_API_CONFIG.MODELS.GAME_DETECTION
      ),
      {
        modelType: ML_API_CONFIG.MODELS.GAME_DETECTION,
        endpoint: '/ml/game-detection'
      }
    );
  },
  
  /**
   * Optimize a specific game using ML recommendations
   */
  optimizeGame: async (gameId: string, options: {
    optimizeRoutes?: boolean,
    optimizeSettings?: boolean,
    optimizeSystem?: boolean,
    aggressiveness?: 'low' | 'medium' | 'high',
    systemInfo?: any // NOVO: Permitir envio de informações do sistema
  } = {}) => {
    // Default all options to true if not specified
    const finalOptions = {
      optimizeRoutes: true,
      optimizeSettings: true,
      optimizeSystem: true,
      aggressiveness: 'medium',
      ...options
    };
    
    console.log(`🔧 Iniciando otimização para jogo ID: ${gameId}`, {
      options: finalOptions
    });
    
    return mlApiClient.withRetry(
      () => mlApiClient.fetch<{
        success: boolean,
        optimizationType: 'network' | 'system' | 'both' | 'none',
        improvements: {
          latency?: number,
          fps?: number,
          stability?: number
        }
      }>(
        `/ml/optimize-game/${gameId}`,
        {
          method: 'POST',
          body: JSON.stringify(finalOptions),
        },
        ML_API_CONFIG.MODELS.ROUTE_OPTIMIZER
      ),
      {
        modelType: ML_API_CONFIG.MODELS.ROUTE_OPTIMIZER,
        endpoint: `/ml/optimize-game/${gameId}`
      }
    );
  }
};

/**
 * Diagnostic utility to test ML API connectivity
 */
export const mlDiagnostics = {
  /**
   * Test connectivity to all ML endpoints
   */
  testConnectivity: async (): Promise<{
    success: boolean,
    results: Record<string, { success: boolean, error?: string }>
  }> => {
    console.log('🧪 Running ML connectivity diagnostics');
    
    const results: Record<string, { success: boolean, error?: string }> = {};
    let success = true;
    
    // Test route optimizer
    try {
      await mlApiClient.fetch('/ml/health/route-optimizer', 
        { method: 'GET' }, 
        ML_API_CONFIG.MODELS.ROUTE_OPTIMIZER
      );
      results['routeOptimizer'] = { success: true };
    } catch (error: any) {
      success = false;
      results['routeOptimizer'] = { 
        success: false, 
        error: error.message || 'Unknown error' 
      };
    }
    
    // Test performance predictor
    try {
      await mlApiClient.fetch('/ml/health/performance-predictor',
        { method: 'GET' },
        ML_API_CONFIG.MODELS.PERFORMANCE_PREDICTOR
      );
      results['performancePredictor'] = { success: true };
    } catch (error: any) {
      success = false;
      results['performancePredictor'] = { 
        success: false, 
        error: error.message || 'Unknown error'
      };
    }
    
    // Test game detection
    try {
      await mlApiClient.fetch('/ml/health/game-detection',
        { method: 'GET' },
        ML_API_CONFIG.MODELS.GAME_DETECTION
      );
      results['gameDetection'] = { success: true };
    } catch (error: any) {
      success = false;
      results['gameDetection'] = { 
        success: false, 
        error: error.message || 'Unknown error'
      };
    }
    
    // Test de otimização de jogo específico
    try {
      // Usar ID de teste genérico apenas para verificar conectividade
      await mlApiClient.fetch('/ml/health/game-optimization',
        { method: 'GET' },
        'game-optimization'
      );
      results['gameOptimization'] = { success: true };
    } catch (error: any) {
      success = false;
      results['gameOptimization'] = { 
        success: false, 
        error: error.message || 'Unknown error'
      };
    }
    
    console.log('🧪 ML diagnostics results:', results);
    return { success, results };
  },
  
  /**
   * Check if redirect protection is working
   */
  testRedirectProtection: async (): Promise<{
    protected: boolean,
    details: string
  }> => {
    try {
      // Tentativa deliberada de usar uma URL que deveria redirecionar
      const testUrl = '/ml/test-redirect';
      
      await mlApiClient.fetch(testUrl, 
        { method: 'GET' }, 
        'redirect-test'
      );
      
      // Se chegou aqui, não detectou o redirecionamento corretamente
      return { 
        protected: false, 
        details: 'Redirect protection may not be working correctly' 
      };
    } catch (error: any) {
      // Esperamos que lance um erro devido à proteção de redirecionamento
      if (error instanceof MLApiError && 
          (error.message.includes('redirect') || error.message.includes('blocked'))) {
        return { 
          protected: true, 
          details: 'Redirect protection is working correctly' 
        };
      }
      
      return { 
        protected: false, 
        details: `Unexpected error: ${error.message}` 
      };
    }
  },
  
  /**
   * Check for browser extensions that might interfere with ML requests
   */
  checkForInterfereingExtensions: (): { 
    detected: boolean, 
    extensions: string[]
  } => {
    console.log('🔍 Checking for browser extensions that may interfere with ML operations');
    
    const potentialIssues: string[] = [];
    
    // Check for signs of security software in global objects
    if (typeof window !== 'undefined') {
      // Kaspersky check
      if ('KasperskyLabs' in window) {
        potentialIssues.push('Kaspersky Security Suite');
      }
      
      // Check for ESET
      if ('ESETS_ID' in window || document.querySelector('script[src*="eset"]')) {
        potentialIssues.push('ESET Security');
      }
      
      // Check for Avast/AVG
      if (document.querySelector('script[src*="avast"]') || 
          document.querySelector('script[src*="avg"]')) {
        potentialIssues.push('Avast/AVG Antivirus');
      }
      
      // Check for browser extensions that modify content
      const injectedStyles = Array.from(document.styleSheets).filter(
        sheet => sheet.href && !sheet.href.startsWith(window.location.origin)
      ).length;
      
      if (injectedStyles > 0) {
        potentialIssues.push('Content-modifying browser extensions');
      }
      
      // Check for ad blockers
      const testAdElement = document.createElement('div');
      testAdElement.className = 'adsbox';
      testAdElement.style.height = '1px';
      testAdElement.style.width = '1px';
      testAdElement.style.position = 'absolute';
      testAdElement.style.top = '-1000px';
      document.body.appendChild(testAdElement);
      
      setTimeout(() => {
        const isAdBlockActive = testAdElement.offsetHeight === 0;
        if (isAdBlockActive) {
          potentialIssues.push('Ad blocker extension');
        }
        testAdElement.remove();
      }, 100);
    }
    
    return {
      detected: potentialIssues.length > 0,
      extensions: potentialIssues
    };
  }
};
