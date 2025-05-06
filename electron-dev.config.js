
/**
 * Electron configuration helper
 * This file provides setup for Electron in development mode
 */

const path = require('path');
const { spawn } = require('child_process');

/**
 * Start the vite development server
 * @returns {Promise<void>}
 */
async function startViteDevServer() {
  return new Promise((resolve, reject) => {
    // Use the locally installed vite
    const viteScript = path.join(__dirname, 'node_modules', '.bin', 'vite');
    
    // Start vite dev server
    const viteProcess = spawn(viteScript, ['--config', 'vite.config.local.ts'], { 
      stdio: 'inherit',
      shell: true
    });
    
    viteProcess.on('error', (err) => {
      console.error('Failed to start vite server:', err);
      reject(err);
    });
    
    // Wait a bit for the server to start
    setTimeout(() => resolve(viteProcess), 2000);
  });
}

/**
 * Start the backend development server
 * @returns {Promise<void>}
 */
async function startBackendServer() {
  return new Promise((resolve, reject) => {
    // Start Python backend server
    const backendProcess = spawn('python', ['backend/main.py'], { 
      stdio: 'inherit',
      shell: true
    });
    
    backendProcess.on('error', (err) => {
      console.error('Failed to start backend server:', err);
      reject(err);
    });
    
    // Wait a bit for the server to start
    setTimeout(() => resolve(backendProcess), 2000);
  });
}

/**
 * Main development function to start both servers
 */
async function startDevelopment() {
  try {
    console.log('Starting Vite development server...');
    const viteProcess = await startViteDevServer();
    
    console.log('Starting Python backend server...');
    const backendProcess = await startBackendServer();
    
    console.log('✅ Development environment ready!');
    console.log('🌐 Frontend: http://localhost:8080');
    console.log('🌐 Backend: http://localhost:8000');
    
    // Handle shutdown
    const cleanup = () => {
      console.log('Shutting down servers...');
      viteProcess.kill();
      backendProcess.kill();
      process.exit(0);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
  } catch (error) {
    console.error('Failed to start development environment:', error);
    process.exit(1);
  }
}

// Start the development environment if this file is executed directly
if (require.main === module) {
  startDevelopment();
}

module.exports = {
  startViteDevServer,
  startBackendServer
};
