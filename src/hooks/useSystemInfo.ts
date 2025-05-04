
import { useState, useEffect } from 'react';

interface SystemInfo {
  cpu?: {
    model?: string;
    cores?: number;
    threads?: number;
  };
  memory?: {
    total?: number; // in GB
    type?: string;
    speed?: number; // in MHz
  };
  gpu?: {
    model?: string;
    vram?: number; // in GB
    driver?: string;
  };
  os?: {
    name?: string;
    version?: string;
    build?: string;
  };
}

// Adding TypeScript interface for Navigator with deviceMemory
interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
}

export function useSystemInfo() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function fetchSystemInfo() {
      try {
        // First try to get info from Electron API if available
        if (window.electron) {
          // In a real implementation, this would call to electron
          // For now, we'll just use mock data in both cases
          const electronInfo = await getMockSystemInfo();
          setSystemInfo(electronInfo);
          setIsLoading(false);
          return;
        }
        
        // Fallback to web API and browser detection
        const webSystemInfo = await getWebSystemInfo();
        setSystemInfo(webSystemInfo);
      } catch (err) {
        console.error("Error getting system info:", err);
        setError(err instanceof Error ? err : new Error("Failed to get system info"));
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSystemInfo();
  }, []);
  
  // A real implementation would use actual system API data
  // This is just mock data for demonstration
  async function getMockSystemInfo(): Promise<SystemInfo> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      cpu: {
        model: "AMD Ryzen 7 5800X",
        cores: 8,
        threads: 16
      },
      memory: {
        total: 32,
        type: "DDR4",
        speed: 3600
      },
      gpu: {
        model: "NVIDIA GeForce RTX 3070",
        vram: 8,
        driver: "512.95"
      },
      os: {
        name: "Windows",
        version: "11",
        build: "22H2"
      }
    };
  }
  
  // Try to get some basic system info from web APIs
  async function getWebSystemInfo(): Promise<SystemInfo> {
    const info: SystemInfo = {};
    
    try {
      // Get memory info - using the extended navigator type
      const navigatorWithMemory = navigator as NavigatorWithMemory;
      if (navigatorWithMemory.deviceMemory) {
        info.memory = {
          total: navigatorWithMemory.deviceMemory
        };
      }
      
      // Get basic CPU info
      const cpuCores = navigator.hardwareConcurrency;
      if (cpuCores) {
        info.cpu = {
          cores: cpuCores,
          threads: cpuCores
        };
      }
      
      // Get basic OS info
      const userAgent = navigator.userAgent;
      info.os = {
        name: getOSNameFromUserAgent(userAgent),
        version: getOSVersionFromUserAgent(userAgent)
      };
      
      // Try to get GPU info via WebGL
      info.gpu = {
        model: getGPUInfo()
      };
    } catch (err) {
      console.error("Error getting web system info:", err);
    }
    
    return info;
  }
  
  function getOSNameFromUserAgent(ua: string): string {
    if (ua.indexOf("Windows") !== -1) return "Windows";
    if (ua.indexOf("Mac") !== -1) return "macOS";
    if (ua.indexOf("Linux") !== -1) return "Linux";
    if (ua.indexOf("Android") !== -1) return "Android";
    if (ua.indexOf("iOS") !== -1) return "iOS";
    return "Unknown";
  }
  
  function getOSVersionFromUserAgent(ua: string): string {
    // Very simplified version detection
    if (ua.indexOf("Windows NT 10.0") !== -1) return "10";
    if (ua.indexOf("Windows NT 6.3") !== -1) return "8.1";
    if (ua.indexOf("Windows NT 6.2") !== -1) return "8";
    if (ua.indexOf("Windows NT 6.1") !== -1) return "7";
    if (ua.indexOf("Mac OS X") !== -1) {
      const matches = ua.match(/Mac OS X (\d+[._]\d+)/);
      if (matches) return matches[1].replace("_", ".");
    }
    return "";
  }
  
  function getGPUInfo(): string {
    try {
      const canvas = document.createElement('canvas');
      // Cast to WebGLRenderingContext to ensure we have the correct type with getExtension
      const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      
      if (!gl) {
        return "Unknown";
      }
      
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
    } catch (e) {
      console.error("Error getting GPU info:", e);
    }
    
    return "Unknown";
  }
  
  return { systemInfo, isLoading, error };
}
