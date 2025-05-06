
# GamePath AI Setup Guide

## Critical Issue: Missing package-lock.json

The project is missing a `package-lock.json` file which is required for correct dependency resolution.
This is causing problems with the build process in Lovable's environment.

## How to Fix the Setup

### 1. Install Dependencies

Run one of the following commands in the project root:

```bash
# Using npm (recommended for this project)
npm install

# Or using yarn
yarn

# Or using pnpm
pnpm install
```

This will generate a `package-lock.json` file which is essential for consistent dependency installation.

### 2. Fix the Electron Forge Version

The current project tries to use `electron-forge@^7.0.0` which doesn't exist. Replace it with a valid version:

```bash
# Remove the invalid dependency
npm uninstall electron-forge

# Install a valid version
npm install --save-dev @electron-forge/cli@6.4.2
```

### 3. Run the Development Server

To run both the frontend and backend:

```bash
# Start the frontend
npm run dev

# In another terminal, start the backend
python backend/main.py
```

## Accessing the Application

After starting both servers:

- Frontend: http://localhost:8080
- Backend: http://localhost:8000

## Troubleshooting

If you continue to see TypeScript errors about missing modules, try:

```bash
npm install --save-dev @types/react @types/react-dom @types/node
```

For Vite "command not found" errors, ensure Vite is properly installed:

```bash
npm install --save-dev vite
```
