import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vpnService } from "../services/vpnService";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { isWebAuthnSupported } from "../utils/webAuthnSupport";
import { getApiBaseUrl } from "../utils/urlRedirects";

export function useVpn() {
  const queryClient = useQueryClient();
  const [isBackendOnline, setIsBackendOnline] = useState<boolean | null>(null);
  const apiBaseUrl = getApiBaseUrl();
  
  // Verificar periodicamente se o backend está disponível
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const healthUrl = `${apiBaseUrl}/health`;
        const response = await fetch(healthUrl, { 
          mode: 'cors',
          method: 'HEAD',
          cache: 'no-cache'
        });
        const isOnline = response.ok;
        
        if (isBackendOnline === false && isOnline === true) {
          toast.success("Conexão com o servidor restaurada", {
            description: "Usando dados reais do servidor"
          });
        } else if (isBackendOnline === true && isOnline === false) {
          toast.warning("Servidor indisponível", {
            description: "Usando dados simulados temporariamente"
          });
        }
        
        setIsBackendOnline(isOnline);
      } catch (error) {
        if (isBackendOnline === true) {
          toast.warning("Servidor indisponível", {
            description: "Usando dados simulados temporariamente"
          });
        }
        setIsBackendOnline(false);
      }
    };
    
    // Verificar imediatamente na inicialização
    checkBackend();
    
    // Configurar verificação periódica
    const interval = setInterval(checkBackend, 15000); // Verificar a cada 15 segundos
    
    return () => clearInterval(interval);
  }, [isBackendOnline, apiBaseUrl]);
  
  const statusQuery = useQuery({
    queryKey: ["vpnStatus"],
    queryFn: vpnService.getStatus,
    refetchInterval: 3000, // Atualizar a cada 3 segundos para manter a UI sincronizada
    retry: 1,
    staleTime: 2000 // Reduzido para garantir atualizações mais frequentes
  });
  
  const serversQuery = useQuery({
    queryKey: ["vpnServers"],
    queryFn: vpnService.getAvailableServers,
    retry: 1,
    staleTime: 30000
  });
  
  // Função para lidar com WebAuthn de forma segura
  const connectWithAuth = async (serverId: string) => {
    try {
      // Tentativa de usar WebAuthn se suportado
      let webAuthnSupported = false;
      try {
        webAuthnSupported = isWebAuthnSupported();
        if (webAuthnSupported) {
          console.log("Using WebAuthn for authentication");
        }
      } catch (error) {
        console.warn("Error checking WebAuthn support:", error);
      }
      
      // Conectar com o serviço VPN
      return await vpnService.connect(serverId);
    } catch (error) {
      console.error("Connection authentication error:", error);
      // Revertendo para autenticação padrão
      return await vpnService.connect(serverId);
    }
  };
  
  const connectMutation = useMutation({
    mutationFn: connectWithAuth,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vpnStatus"] });
      // Invalidar também as métricas para atualizar ping e jitter
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
    onError: (error: any) => {
      console.error("VPN connection error:", error);
      toast.error("Falha ao conectar VPN", {
        description: error.message || "Verifique sua conexão e tente novamente"
      });
    }
  });
  
  const disconnectMutation = useMutation({
    mutationFn: vpnService.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vpnStatus"] });
      // Invalidar também as métricas para atualizar ping e jitter
      queryClient.invalidateQueries({ queryKey: ["metrics"] });
    },
    onError: (error: any) => {
      console.error("VPN disconnection error:", error);
      toast.error("Falha ao desconectar VPN", {
        description: error.message || "Tente novamente"
      });
    }
  });
  
  // Determinar se o VPN está realmente conectado
  const isConnected = statusQuery.data?.connected || false;
  
  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    servers: serversQuery.data,
    isLoadingServers: serversQuery.isLoading,
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    isConnecting: connectMutation.isPending,
    isDisconnecting: disconnectMutation.isPending,
    isConnected, // Adicionando propriedade explícita
    isBackendOnline,
    isWebAuthnSupported: isWebAuthnSupported(),
    refetch: () => {
      statusQuery.refetch();
      serversQuery.refetch();
    }
  };
}
