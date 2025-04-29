// Configuração do ambiente
const API_ENV = {
  production: "http://gamepathai-dev-lb-1728469102.us-east-1.elb.amazonaws.com",
  local: "http://localhost:3000" // Ajuste esta porta para a do seu servidor local
};

// Forçar uso do ambiente local para testes
const API_BASE_URL = API_ENV.local; // Forçando uso do servidor local

// Log para diagnóstico - verificar qual URL está sendo usada
console.log("API_BASE_URL sendo usado:", API_BASE_URL);

export const apiClient = {
  async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };
    
    const token = localStorage.getItem("auth_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    try {
      console.log(`Fazendo requisição para: ${url}`);
      
      // Removi temporariamente credentials: include para testes iniciais
      const response = await fetch(url, {
        ...options,
        headers,
        mode: "cors"
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log("Token expirado, tentando renovar...");
          const renewed = await tryRenewToken();
          if (renewed) {
            return apiClient.fetch<T>(endpoint, options);
          }
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw {
          status: response.status,
          ...errorData
        };
      }
      
      return response.json() as Promise<T>;
    } catch (error) {
      console.error(`Falha na requisição para ${endpoint}:`, error);
      
      // Log adicional para diagnóstico de erros
      console.log("Detalhes do erro:", JSON.stringify(error, null, 2));
      
      throw {
        status: "error",
        message: "Falha ao buscar dados do servidor",
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
    
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      mode: "cors"
      // Removi temporariamente credentials: include para testes
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
    console.log("Testando conexão com:", `${API_BASE_URL}/api/health`);
    
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      mode: "cors",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    if (response.ok) {
      console.log("Backend connection successful");
      return true;
    } else {
      console.error(`Backend health check failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error("Backend connection test failed:", error);
    console.log("Detalhes do erro de conexão:", JSON.stringify(error, null, 2));
    return false;
  }
};

// Executar teste de conexão ao carregar
testBackendConnection()
  .then(isConnected => console.log("Resultado do teste de conexão:", isConnected))
  .catch(err => console.error("Erro ao testar conexão:", err));
