
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  isElectron: true,
  platform: process.platform,
  // Add any specific API methods you want to expose to your web app here
  
  // Hardware monitoring
  getHardwareInfo: () => ipcRenderer.invoke('get-hardware-info'),
  startHardwareMonitoring: (interval) => ipcRenderer.invoke('start-hardware-monitoring', interval),
  stopHardwareMonitoring: () => ipcRenderer.invoke('stop-hardware-monitoring'),
  onHardwareUpdate: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('hardware-data', subscription);
    
    return () => {
      ipcRenderer.removeListener('hardware-data', subscription);
    };
  },
  
  // Network tools
  pingServer: (host, count) => ipcRenderer.invoke('ping-server', host, count),
  traceRoute: (host) => ipcRenderer.invoke('trace-route', host),
  onNetworkUpdate: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('network-data', subscription);
    
    return () => {
      ipcRenderer.removeListener('network-data', subscription);
    };
  },
  
  // Game detection
  detectGames: () => ipcRenderer.invoke('detect-games'),
  onGameDetected: (callback) => {
    const subscription = (_event, data) => callback(data);
    ipcRenderer.on('game-detected', subscription);
    
    return () => {
      ipcRenderer.removeListener('game-detected', subscription);
    };
  },
  
  // Permissions system
  checkPermission: (permissionType) => ipcRenderer.invoke('check-permission', permissionType),
  requestPermission: (permissionType) => ipcRenderer.invoke('request-permission', permissionType),
  listPermissions: () => ipcRenderer.invoke('list-permissions'),
  revokePermission: (permissionType) => ipcRenderer.invoke('revoke-permission', permissionType)
});
