
/**
 * Environment detection utilities for handling different modes
 */

/**
 * Check if we are in production mode
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if we are in development mode
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if we are in test mode
 */
export const isTest = (): boolean => {
  return process.env.NODE_ENV === 'test';
};

/**
 * Check if we are in Electron environment
 */
export const isElectron = (): boolean => {
  // Electron defines window.process, browser doesn't
  return typeof window !== 'undefined' && 
    typeof window.process === 'object' && 
    // FIXED: Check renderer type safely with optional chaining
    window.process?.type === 'renderer';
};

/**
 * Check if we are in Electron main process
 */
export const isElectronMain = (): boolean => {
  return typeof process !== 'undefined' && 
    process.versions && 
    !!process.versions.electron && 
    // FIXED: Access 'type' safely with optional chaining
    process?.type !== 'renderer';
};

/**
 * Check if we are running inside AWS Lambda
 */
export const isAWSLambda = (): boolean => {
  return typeof process !== 'undefined' && 
    !!process.env.AWS_LAMBDA_FUNCTION_NAME;
};

/**
 * Get the current environment name
 */
export const getEnvironmentName = (): string => {
  if (isProduction()) {
    return 'production';
  } else if (isDevelopment()) {
    return 'development';
  } else if (isTest()) {
    return 'test';
  } else {
    return 'unknown';
  }
};

/**
 * Get environment-specific config
 */
export const getEnvironmentConfig = <T extends Record<string, any>>(
  configs: {
    production?: T;
    development?: T;
    test?: T;
    default: T;
  }
): T => {
  const env = getEnvironmentName();
  
  if (env === 'production' && configs.production) {
    return configs.production;
  } else if (env === 'development' && configs.development) {
    return configs.development;
  } else if (env === 'test' && configs.test) {
    return configs.test;
  }
  
  return configs.default;
};
