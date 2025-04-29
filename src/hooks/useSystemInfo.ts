
import { useState, useEffect } from 'react';
import { mlApiClient } from '@/services/mlApiClient';

interface SystemInfo {
  cpu: {
    model: string;
    cores: number;
    threads: number;
    speed: number;
  };
  ram: {
    total: number; // in GB
    free: number;
    usage: number; // percentage
  };
  gpu: {
    model: string;
    vram: number; // in GB
    driver: string;
  };
  network: {
    bandwidth: number; // in Mbps
    latency: number; // in ms
    jitter: number; // in ms
  };
}

export const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const fetchSystemInfo = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to fetch from ML API first
      const result = await mlApiClient.fetch<{ systemInfo: SystemInfo }>(
        '/ml/system-info',
        { method: 'GET' },
        'system-info'
      );
      
      setSystemInfo(result.systemInfo);
    } catch (mlError) {
      console.log("⚠️ ML system info fetch failed, trying standard API");
      
      try {
        // Fall back to standard API
        const response = await fetch('/api/system/info');
        
        if (!response.ok) {
          throw new Error('Failed to fetch system info');
        }
        
        const data = await response.json();
        setSystemInfo(data.systemInfo);
      } catch (standardError) {
        console.error("❌ Failed to fetch system info:", standardError);
        
        // Use mock data as last resort
        setSystemInfo({
          cpu: {
            model: "Intel Core i7-10700K",
            cores: 8,
            threads: 16,
            speed: 3.8
          },
          ram: {
            total: 16,
            free: 8,
            usage: 50
          },
          gpu: {
            model: "NVIDIA GeForce RTX 3070",
            vram: 8,
            driver: "531.42"
          },
          network: {
            bandwidth: 100,
            latency: 24,
            jitter: 3
          }
        });
        
        setError('Using estimated system information');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchSystemInfo();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchSystemInfo, 300000);
    
    return () => clearInterval(interval);
  }, []);
  
  return {
    systemInfo,
    isLoading,
    error,
    refreshSystemInfo: fetchSystemInfo
  };
};
