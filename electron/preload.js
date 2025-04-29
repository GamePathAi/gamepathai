
const { contextBridge } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron', {
    isElectron: true,
    platform: process.platform,
    // Add any specific API methods you want to expose to your web app here
  }
);

