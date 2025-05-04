
/**
 * API URL utilities
 */

import { DOMAINS } from './constants';
import { isProduction } from './environmentDetection';

/**
 * Gets the appropriate API base URL for the current environment
 * Always returns a URL with a trailing slash
 */
export const getApiBaseUrl = (): string => {
  // CHANGED: Always use relative paths to avoid redirect issues
  // This prevents the redirects we're seeing in the logs
  return '';
};

// Make sure to export getApiBaseUrl in the URL index file
