
import { useQuery } from "@tanstack/react-query";
import { metricsService } from "../services/metricsService";
import { useState, useEffect } from "react";
import { MetricData, SystemData } from "../types/metrics";
import { getApiBaseUrl } from "../utils/urlRedirects";

export function useMetrics(gameId?: string) {
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const apiBaseUrl = getApiBaseUrl();
  
  // Verificar se estamos em modo offline (backend indisponível)
  useEffect(() => {
    const checkBackend = async () => {
      try {
        // Ensure we use a clean URL without duplicated /api/
        const healthUrl = `${apiBaseUrl}/health`.replace(/\/api\/api\//g, '/api/');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(healthUrl, { 
          mode: 'cors',
          method: 'HEAD',
          headers: {
            "Accept": "application/json",
            "X-No-Redirect": "1"
          },
          cache: 'no-cache',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        setIsOfflineMode(!response.ok);
      } catch (error) {
        setIsOfflineMode(true);
      }
    };
    
    checkBackend();
    const interval = setInterval(checkBackend, 60000); // Verificar a cada minuto
    
    return () => clearInterval(interval);
  }, [apiBaseUrl]);
  
  const pingQuery = useQuery({
    queryKey: ["metrics", "ping"],
    queryFn: metricsService.getPing,
    refetchInterval: isOfflineMode ? false : 10000, // Atualizar a cada 10 segundos se estiver online
    retry: isOfflineMode ? false : 1,
    staleTime: 5000
  });
  
  const jitterQuery = useQuery({
    queryKey: ["metrics", "jitter"],
    queryFn: metricsService.getJitter,
    refetchInterval: isOfflineMode ? false : 10000,
    retry: isOfflineMode ? false : 1,
    staleTime: 5000
  });
  
  const fpsQuery = useQuery({
    queryKey: ["metrics", "fps", gameId],
    queryFn: () => metricsService.getFps(gameId),
    refetchInterval: isOfflineMode ? false : 5000,
    enabled: !!gameId, // Só buscar FPS se tiver um jogo
    retry: isOfflineMode ? false : 1,
    staleTime: 5000
  });
  
  const systemQuery = useQuery({
    queryKey: ["metrics", "system"],
    queryFn: metricsService.getSystem,
    refetchInterval: isOfflineMode ? false : 15000, // Atualizar a cada 15 segundos se estiver online
    retry: isOfflineMode ? false : 1,
    staleTime: 5000
  });
  
  return {
    ping: pingQuery.data as MetricData | undefined,
    jitter: jitterQuery.data as MetricData | undefined,
    fps: fpsQuery.data as MetricData | undefined,
    system: systemQuery.data as SystemData | undefined,
    isLoading: {
      ping: pingQuery.isLoading,
      jitter: jitterQuery.isLoading,
      fps: fpsQuery.isLoading,
      system: systemQuery.isLoading
    },
    isError: {
      ping: pingQuery.isError,
      jitter: jitterQuery.isError,
      fps: fpsQuery.isError,
      system: systemQuery.isError
    },
    isOfflineMode,
    refetch: () => {
      pingQuery.refetch();
      jitterQuery.refetch();
      fpsQuery.refetch();
      systemQuery.refetch();
    }
  };
}
