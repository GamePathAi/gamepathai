
interface ElectronAPI {
  isElectron: boolean;
  platform: string;
  
  // Hardware monitoring
  getHardwareInfo: () => Promise<any>;
  startHardwareMonitoring: (interval: number) => Promise<boolean>;
  stopHardwareMonitoring: () => Promise<boolean>;
  onHardwareUpdate: (callback: (data: any) => void) => () => void;
  
  // Network tools
  pingServer: (host: string, count: number) => Promise<any>;
  traceRoute: (host: string) => Promise<any>;
  onNetworkUpdate: (callback: (data: any) => void) => () => void;
  
  // Game detection
  detectGames: () => Promise<any[]>;
  onGameDetected: (callback: (data: any) => void) => () => void;
  
  // Permissions system
  checkPermission: (permissionType: string) => Promise<boolean>;
  requestPermission: (permissionType: string) => Promise<boolean>;
  listPermissions: () => Promise<Record<string, boolean>>;
  revokePermission: (permissionType: string) => Promise<boolean>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

export {};
