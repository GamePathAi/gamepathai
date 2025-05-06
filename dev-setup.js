
/**
 * Development setup script
 * Run this script to check and fix common development issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

console.log(`${colors.cyan}=========================${colors.reset}`);
console.log(`${colors.cyan}GamePath AI Setup Checker${colors.reset}`);
console.log(`${colors.cyan}=========================${colors.reset}\n`);

// Check if package-lock.json exists
const hasPackageLock = fs.existsSync(path.join(__dirname, 'package-lock.json'));
if (!hasPackageLock) {
  console.log(`${colors.red}❌ Missing package-lock.json${colors.reset}`);
  console.log(`${colors.yellow}This is a critical issue that needs to be resolved.${colors.reset}`);
  console.log(`${colors.yellow}Run 'npm install' to generate package-lock.json${colors.reset}\n`);
} else {
  console.log(`${colors.green}✅ package-lock.json exists${colors.reset}\n`);
}

// Check if vite is properly installed
try {
  // Check if vite exists in node_modules/.bin
  const viteExists = fs.existsSync(path.join(__dirname, 'node_modules', '.bin', 'vite'));
  if (viteExists) {
    console.log(`${colors.green}✅ Vite is installed${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Vite not found in node_modules${colors.reset}`);
    console.log(`${colors.yellow}Run 'npm install vite' to install Vite${colors.reset}\n`);
  }
} catch (error) {
  console.log(`${colors.red}❌ Error checking Vite: ${error.message}${colors.reset}\n`);
}

// Check for electron-forge
try {
  const packageJson = require('./package.json');
  const hasBadElectronForge = packageJson.devDependencies && 
    packageJson.devDependencies['electron-forge'] === '^7.0.0';
  
  if (hasBadElectronForge) {
    console.log(`${colors.red}❌ Invalid electron-forge version found: ^7.0.0${colors.reset}`);
    console.log(`${colors.yellow}You need to update to a valid version like 6.4.2${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✅ electron-forge version looks okay${colors.reset}\n`);
  }
} catch (error) {
  console.log(`${colors.red}❌ Error checking electron-forge: ${error.message}${colors.reset}\n`);
}

// Check TypeScript setup
try {
  const tsConfigExists = fs.existsSync(path.join(__dirname, 'tsconfig.json'));
  if (tsConfigExists) {
    console.log(`${colors.green}✅ tsconfig.json exists${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Missing tsconfig.json${colors.reset}`);
  }
  
  // Check if type declarations file exists
  const typesFileExists = fs.existsSync(path.join(__dirname, 'src', 'react-app-env.d.ts'));
  if (typesFileExists) {
    console.log(`${colors.green}✅ Type declarations file exists${colors.reset}\n`);
  } else {
    console.log(`${colors.red}❌ Missing type declarations file${colors.reset}`);
    console.log(`${colors.yellow}Run the setup from SETUP.md to create it${colors.reset}\n`);
  }
} catch (error) {
  console.log(`${colors.red}❌ Error checking TypeScript setup: ${error.message}${colors.reset}\n`);
}

console.log(`${colors.cyan}==============${colors.reset}`);
console.log(`${colors.cyan}Next Steps:${colors.reset}`);
console.log(`${colors.cyan}==============${colors.reset}`);
console.log(`1. Read the ${colors.green}SETUP.md${colors.reset} file for detailed instructions`);
console.log(`2. Run ${colors.green}npm install${colors.reset} to generate package-lock.json`);
console.log(`3. Start frontend: ${colors.green}npm run dev${colors.reset}`);
console.log(`4. Start backend: ${colors.green}python backend/main.py${colors.reset}\n`);
