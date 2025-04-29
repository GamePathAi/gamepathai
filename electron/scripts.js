
/**
 * This file contains the scripts to add to package.json
 * You'll need to manually add these scripts since we can't directly edit package.json
 */

const electronScripts = {
  "electron:dev": "concurrently \"cross-env IS_ELECTRON=true vite\" \"electron .\"",
  "electron:build": "vite build && electron-builder",
  "electron:build:win": "vite build && electron-builder --win",
  "electron:build:mac": "vite build && electron-builder --mac",
  "electron:build:linux": "vite build && electron-builder --linux"
};

console.log('Add these scripts to your package.json:');
console.log(JSON.stringify(electronScripts, null, 2));
