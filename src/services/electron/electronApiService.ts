
import { PermissionType } from "@/contexts/PermissionsContext";

/**
 * Typed wrapper for the Electron API to provide better error handling
 * and type safety for the application
 */
class ElectronApiService {
  /**
   * Checks if the app is running in Electron environment
   */
  isElectron(): boolean {
    return window.electron !== undefined;
  }
  
  /**
   * Gets the platform the app is running on
   */
  getPlatform(): string {
    if (!this.isElectron()) return "browser";
    return window.electron.platform;
  }
  
  /**
   * Gets hardware information from the system
   * Requires hardware_monitoring permission
   */
  async getHardwareInfo(): Promise<any> {
    if (!this.isElectron()) {
      console.log("Running in browser mode - returning mock hardware data");
      return this.generateMockHardwareData();
    }
    
    try {
      return await window.electron.getHardwareInfo();
    } catch (error) {
      console.error("Failed to get hardware info:", error);
      throw new Error("Failed to get hardware info");
    }
  }
  
  /**
   * Starts monitoring hardware
   * Requires hardware_monitoring permission
   */
  async startHardwareMonitoring(interval: number): Promise<boolean> {
    if (!this.isElectron()) {
      console.log("Running in browser mode - hardware monitoring simulated");
      return true;
    }
    
    try {
      return await window.electron.startHardwareMonitoring(interval);
    } catch (error) {
      console.error("Failed to start hardware monitoring:", error);
      throw new Error("Failed to start hardware monitoring");
    }
  }
  
  /**
   * Stops monitoring hardware
   */
  async stopHardwareMonitoring(): Promise<boolean> {
    if (!this.isElectron()) {
      return true;
    }
    
    try {
      return await window.electron.stopHardwareMonitoring();
    } catch (error) {
      console.error("Failed to stop hardware monitoring:", error);
      throw new Error("Failed to stop hardware monitoring");
    }
  }
  
  /**
   * Registers a callback for hardware updates
   * Requires hardware_monitoring permission
   */
  onHardwareUpdate(callback: (data: any) => void): () => void {
    if (!this.isElectron()) {
      console.log("Running in browser mode - hardware updates simulated");
      
      // Set up a mock interval for browser testing
      const intervalId = setInterval(() => {
        callback(this.generateMockHardwareData());
      }, 2000);
      
      return () => clearInterval(intervalId);
    }
    
    return window.electron.onHardwareUpdate(callback);
  }
  
  /**
   * Pings a server to measure latency
   * Requires network_tools permission
   */
  async pingServer(host: string, count: number = 4): Promise<any> {
    if (!this.isElectron()) {
      console.log("Running in browser mode - returning mock ping data");
      return {
        host,
        ping: Math.random() * 50 + 20,
        packetLoss: Math.random() * 2,
        jitter: Math.random() * 5 + 1,
        timestamp: Date.now()
      };
    }
    
    try {
      return await window.electron.pingServer(host, count);
    } catch (error) {
      console.error(`Failed to ping server ${host}:`, error);
      throw new Error("Failed to ping server");
    }
  }
  
  /**
   * Performs a traceroute to a server
   * Requires network_tools permission
   */
  async traceRoute(host: string): Promise<any> {
    if (!this.isElectron()) {
      console.log("Running in browser mode - returning mock traceroute data");
      return {
        host,
        hops: Array(5).fill(0).map((_, i) => ({
          hop: i + 1,
          ip: `192.168.0.${i + 1}`,
          latency: [30 + Math.random() * 20, 35 + Math.random() * 20, 33 + Math.random() * 20],
          avgLatency: 32 + Math.random() * 20
        })),
        timestamp: Date.now()
      };
    }
    
    try {
      return await window.electron.traceRoute(host);
    } catch (error) {
      console.error(`Failed to trace route to ${host}:`, error);
      throw new Error("Failed to trace route");
    }
  }
  
  /**
   * Registers a callback for network updates
   * Requires network_tools permission
   */
  onNetworkUpdate(callback: (data: any) => void): () => void {
    if (!this.isElectron()) {
      console.log("Running in browser mode - network updates simulated");
      return () => {}; // No-op for browser mode
    }
    
    return window.electron.onNetworkUpdate(callback);
  }
  
  /**
   * Detects games installed on the system
   * Requires game_detection permission
   */
  async detectGames(): Promise<any[]> {
    if (!this.isElectron()) {
      console.log("Running in browser mode - returning mock game data");
      return [
        {
          id: "game1",
          name: "Counter-Strike 2",
          executable: "cs2.exe",
          path: "C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike Global Offensive\\cs2.exe",
          platform: "steam",
          lastPlayed: Date.now() - 86400000
        },
        {
          id: "game2",
          name: "League of Legends",
          executable: "LeagueClient.exe",
          path: "C:\\Riot Games\\League of Legends\\LeagueClient.exe",
          platform: "riot",
          lastPlayed: Date.now() - 172800000
        },
        {
          id: "game3",
          name: "Valorant",
          executable: "VALORANT.exe",
          path: "C:\\Riot Games\\VALORANT\\live\\VALORANT.exe",
          platform: "riot",
          lastPlayed: Date.now() - 259200000
        },
        {
          id: "game4",
          name: "Fortnite",
          executable: "FortniteClient-Win64-Shipping.exe",
          path: "C:\\Program Files\\Epic Games\\Fortnite\\FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe",
          platform: "epic",
          lastPlayed: Date.now() - 345600000
        }
      ];
    }
    
    try {
      return await window.electron.detectGames();
    } catch (error) {
      console.error("Failed to detect games:", error);
      throw new Error("Failed to detect games");
    }
  }
  
  /**
   * Registers a callback for game detection events
   * Requires game_detection permission
   */
  onGameDetected(callback: (data: any) => void): () => void {
    if (!this.isElectron()) {
      console.log("Running in browser mode - game detection simulated");
      return () => {}; // No-op for browser mode
    }
    
    return window.electron.onGameDetected(callback);
  }
  
  /**
   * Helper method to generate mock hardware data for browser testing
   */
  private generateMockHardwareData(): any {
    return {
      cpu: {
        usage: Math.random() * 60 + 10,
        temperature: Math.random() * 30 + 40,
        cores: Array(8).fill(0).map(() => ({
          usage: Math.random() * 60 + 10,
          temperature: Math.random() * 30 + 40
        }))
      },
      memory: {
        total: 16,
        used: Math.random() * 10 + 4,
        usage: (Math.random() * 60 + 20)
      },
      gpu: {
        usage: Math.random() * 70 + 10,
        memory: {
          total: 8,
          used: Math.random() * 4 + 2
        },
        temperature: Math.random() * 30 + 50
      },
      disk: {
        read_speed: Math.random() * 120,
        write_speed: Math.random() * 80
      }
    };
  }
  
  /**
   * Gets the required permission type for a specific API method
   */
  getRequiredPermissionForMethod(methodName: string): PermissionType | null {
    const permissionMap: Record<string, PermissionType> = {
      "getHardwareInfo": "hardware_monitoring",
      "startHardwareMonitoring": "hardware_monitoring",
      "stopHardwareMonitoring": "hardware_monitoring",
      "onHardwareUpdate": "hardware_monitoring",
      
      "pingServer": "network_tools",
      "traceRoute": "network_tools",
      "onNetworkUpdate": "network_tools",
      
      "detectGames": "game_detection",
      "onGameDetected": "game_detection"
    };
    
    return permissionMap[methodName] || null;
  }
}

export const electronApiService = new ElectronApiService();
