
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface SystemInfo {
  cpu: {
    model: string;
    cores: number;
    usage: number;
    temperature: number;
  };
  gpu: {
    model: string;
    vram: number;
    usage: number;
    temperature: number;
  };
  memory: {
    total: number;
    free: number;
    usage: number;
  };
  network: {
    interfaces: string[];
    activeInterface: string;
    latency: number;
    upload: number;
    download: number;
  };
  os: {
    name: string;
    version: string;
    arch: string;
  };
}

// Generate mock system info for development
const generateMockSystemInfo = (): SystemInfo => {
  return {
    cpu: {
      model: "AMD Ryzen 7 5800X",
      cores: 8,
      usage: Math.floor(Math.random() * 30) + 10,
      temperature: Math.floor(Math.random() * 20) + 40
    },
    gpu: {
      model: "NVIDIA GeForce RTX 3070",
      vram: 8,
      usage: Math.floor(Math.random() * 40) + 20,
      temperature: Math.floor(Math.random() * 15) + 55
    },
    memory: {
      total: 32,
      free: Math.floor(Math.random() * 10) + 10,
      usage: Math.floor(Math.random() * 40) + 30
    },
    network: {
      interfaces: ["Ethernet", "Wi-Fi"],
      activeInterface: "Ethernet",
      latency: Math.floor(Math.random() * 100) + 5,
      upload: Math.floor(Math.random() * 50) + 10,
      download: Math.floor(Math.random() * 500) + 100
    },
    os: {
      name: "Windows",
      version: "10",
      arch: "x64"
    }
  };
};

export const useSystemInfo = (refreshInterval = 5000) => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        // Check if running in Electron
        if (window.electron) {
          const info = await window.electron.getHardwareInfo();
          setSystemInfo(info);
        } else {
          // Use mock data for browser development
          setSystemInfo(generateMockSystemInfo());
        }
        setIsLoading(false);
        setError(null);
      } catch (err: any) {
        console.error("Error fetching system info:", err);
        setError(err.message || "Failed to fetch system info");
        setIsLoading(false);
        
        // Fallback to mock data on error
        setSystemInfo(generateMockSystemInfo());
      }
    };

    // Initial fetch
    fetchSystemInfo();
    
    // Set up interval for periodic updates
    const intervalId = setInterval(fetchSystemInfo, refreshInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [refreshInterval]);

  const refreshSystemInfo = async () => {
    setIsLoading(true);
    try {
      if (window.electron) {
        const info = await window.electron.getHardwareInfo();
        setSystemInfo(info);
      } else {
        setSystemInfo(generateMockSystemInfo());
      }
      setIsLoading(false);
      setError(null);
    } catch (err: any) {
      console.error("Error refreshing system info:", err);
      setError(err.message || "Failed to refresh system info");
      setIsLoading(false);
      
      // Show an error toast
      toast.error("Erro ao atualizar informações do sistema", {
        description: err.message || "Não foi possível obter as informações do sistema"
      });
    }
  };

  return {
    systemInfo,
    isLoading,
    error,
    refreshSystemInfo
  };
};
