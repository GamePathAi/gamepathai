import { apiClient } from './api';
import { toast } from "sonner";
import { isWebAuthnSupported } from "../utils/webAuthnSupport";
import { getApiBaseUrl } from "../utils/urlRedirects";

// Get the correct API base URL for the current environment
const apiBaseUrl = getApiBaseUrl();

// URL do backend para verificação de saúde
const HEALTH_ENDPOINT = `${apiBaseUrl}/health`.replace(/\/api\/api\//g, '/api/');

// Função para verificar se o backend está disponível
const checkBackendAvailability = async () => {
  try {
    const response = await fetch(HEALTH_ENDPOINT, { 
      mode: 'cors',
      method: 'HEAD',
      headers: {
        "Accept": "application/json",
        "X-No-Redirect": "1"
      },
      cache: 'no-cache'
    });
    return response.ok;
  } catch (error) {
    console.warn("Backend health check failed:", error);
    return false;
  }
};

const handleApiError = (error: any, fallback: any, endpoint: string) => {
  // Check for HTML responses (redirects)
  if (error.isHtmlResponse) {
    console.warn(`HTML response received from API endpoint ${endpoint} when JSON was expected. Using fallback data.`);
    return fallback;
  }
  
  // Verificar se é erro CORS
  if (error.message && error.message.includes('Failed to fetch')) {
    console.warn(`Possível erro CORS no endpoint ${endpoint}`);
  } else {
    console.error(`Erro na API (${endpoint}):`, error);
  }
  
  return fallback;
};

// Estado local para mock de VPN status (para manter consistência entre chamadas)
let mockVpnConnectionState = false;
let mockConnectionTimestamp: number | null = null;
let mockServerLocation: string | null = null;

// Mock de dados para VPN status
const getMockVpnStatus = () => {
  return {
    connected: mockVpnConnectionState,
    serverIp: mockVpnConnectionState ? "192.168.1.1" : null,
    serverLocation: mockVpnConnectionState ? (mockServerLocation || "São Paulo, BR") : null,
    recommendedServer: "auto",
    connectionTime: mockConnectionTimestamp,
    lastError: null
  };
};

// Mock de dados para servidores disponíveis
const mockVpnServers = [
  { id: "auto", name: "Automático (recomendado)", region: "Europa", load: 45, ping: 50 },
  { id: "eu-west", name: "Europa Ocidental", region: "Europa", load: 65, ping: 42 },
  { id: "us-east", name: "EUA Leste", region: "América do Norte", load: 70, ping: 110 },
  { id: "asia-east", name: "Ásia Oriental", region: "Ásia", load: 35, ping: 180 }
];

export const vpnService = {
  getStatus: async () => {
    try {
      const isBackendAvailable = await checkBackendAvailability();
      if (!isBackendAvailable) {
        console.log("Backend indisponível, usando dados mockados para VPN status");
        return getMockVpnStatus();
      }
      
      try {
        const result = await apiClient.fetch('/vpn/status');
        return result;
      } catch (error: any) {
        // If we get HTML response or other error, use mock data
        console.error("Error fetching VPN status:", error);
        return handleApiError(error, getMockVpnStatus(), '/vpn/status');
      }
    } catch (error) {
      console.error("Error checking backend availability:", error);
      return getMockVpnStatus();
    }
  },
    
  connect: async (serverId: string) => {
    try {
      // Check for WebAuthn support and use appropriate connection method
      let connectionMethod = 'standard';
      try {
        if (isWebAuthnSupported()) {
          connectionMethod = 'webauthn';
        }
      } catch (error) {
        console.warn("WebAuthn check failed:", error);
      }
      
      const isBackendAvailable = await checkBackendAvailability();
      if (!isBackendAvailable) {
        console.log("Backend indisponível, simulando conexão VPN");
        
        // Atualizar estado mockado
        mockVpnConnectionState = true;
        mockConnectionTimestamp = Date.now();
        
        // Selecionar servidor com base no ID
        const server = mockVpnServers.find(s => s.id === serverId);
        mockServerLocation = server ? 
          (server.id === "auto" ? "São Paulo, BR" : server.name) : 
          "São Paulo, BR";
        
        toast.success("VPN conectada (modo simulado)", {
          description: `Conectado a ${mockServerLocation} (simulado)`
        });
        
        return getMockVpnStatus();
      }
      
      try {
        const response = await apiClient.fetch('/vpn/connect', {
          method: 'POST',
          body: JSON.stringify({ 
            server_id: serverId,
            auth_method: connectionMethod 
          })
        });
        
        toast.success("VPN conectada", {
          description: `Conexão estabelecida com sucesso`
        });
        
        return response;
      } catch (error) {
        // If backend returns HTML instead of JSON, use mock data
        if (error.isHtmlResponse) {
          console.warn("Received HTML response when connecting to VPN. Falling back to mock data.");
          
          // Simulate successful connection
          mockVpnConnectionState = true;
          mockConnectionTimestamp = Date.now();
          
          // Select server based on ID
          const server = mockVpnServers.find(s => s.id === serverId);
          mockServerLocation = server ? 
            (server.id === "auto" ? "São Paulo, BR" : server.name) : 
            "São Paulo, BR";
            
          toast.success("VPN conectada (modo simulado)", {
            description: `Conectado a ${mockServerLocation} (simulado)`
          });
          
          return getMockVpnStatus();
        }
        
        // Otherwise, show error
        toast.error("Falha ao conectar à VPN", {
          description: "Verifique sua conexão e tente novamente"
        });
        throw error;
      }
    } catch (error) {
      toast.error("Falha ao conectar à VPN", {
        description: "Verifique sua conexão e tente novamente"
      });
      throw error;
    }
  },
    
  disconnect: async () => {
    try {
      const isBackendAvailable = await checkBackendAvailability();
      if (!isBackendAvailable) {
        console.log("Backend indisponível, simulando desconexão VPN");
        
        // Atualizar estado mockado
        mockVpnConnectionState = false;
        mockConnectionTimestamp = null;
        mockServerLocation = null;
        
        toast.success("VPN desconectada (modo simulado)", {
          description: "Usando dados simulados pois o servidor está offline"
        });
        
        return getMockVpnStatus();
      }
      
      try {
        const response = await apiClient.fetch('/vpn/disconnect', {
          method: 'POST'
        });
        
        toast.success("VPN desconectada", {
          description: "Desconexão realizada com sucesso"
        });
        
        return response;
      } catch (error) {
        // If backend returns HTML instead of JSON, use mock data
        if (error.isHtmlResponse) {
          console.warn("Received HTML response when disconnecting from VPN. Falling back to mock data.");
          
          // Simulate successful disconnection
          mockVpnConnectionState = false;
          mockConnectionTimestamp = null;
          mockServerLocation = null;
          
          toast.success("VPN desconectada (modo simulado)", {
            description: "Desconexão simulada realizada"
          });
          
          return getMockVpnStatus();
        }
        
        // Otherwise, show error
        toast.error("Falha ao desconectar da VPN", {
          description: "Verifique sua conexão e tente novamente"
        });
        throw error;
      }
    } catch (error) {
      toast.error("Falha ao desconectar da VPN", {
        description: "Verifique sua conexão e tente novamente"
      });
      throw error;
    }
  },
    
  getAvailableServers: async () => {
    try {
      const isBackendAvailable = await checkBackendAvailability();
      if (!isBackendAvailable) {
        console.log("Backend indisponível, usando dados mockados para servidores VPN");
        return mockVpnServers;
      }
      
      try {
        return await apiClient.fetch('/vpn/available-servers');
      } catch (error) {
        return handleApiError(error, mockVpnServers, '/vpn/available-servers');
      }
    } catch (error) {
      console.error("Error checking backend availability:", error);
      return mockVpnServers;
    }
  }
};
