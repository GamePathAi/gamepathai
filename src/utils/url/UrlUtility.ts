
/**
 * Centralized URL Utility class to provide a consistent interface
 * for all URL-related operations across the application
 */

import { getApiBaseUrl } from './apiBaseUrl';
import { validateMlEndpoint, isTrustedDomain, detectRedirectAttempt } from './redirectDetection';
import { fixAbsoluteUrl, sanitizeApiUrl, extractApiPath } from './urlSanitization';
import { isUrlSafe, isCorsOrRedirectError } from './url-safety';
import { detectRedirectScripts, setupNavigationMonitor } from './navigationMonitor';
import { isProduction } from './environmentDetection';

export class UrlUtility {
  /**
   * Initialize URL protection mechanisms
   */
  static initializeProtection() {
    setupNavigationMonitor();
    detectRedirectScripts();
  }
  
  /**
   * Get the API base URL for the current environment
   */
  static getApiBaseUrl(): string {
    return getApiBaseUrl();
  }
  
  /**
   * Check if a URL is a trusted domain
   */
  static isTrustedDomain(url: string): boolean {
    return isTrustedDomain(url);
  }
  
  /**
   * Check if a URL is safe to use
   */
  static isSafe(url: string): boolean {
    return isUrlSafe(url);
  }
  
  /**
   * Sanitize an API URL to prevent redirects and XSS
   */
  static sanitizeApiUrl(url: string): string {
    return sanitizeApiUrl(url);
  }
  
  /**
   * Check if a URL is attempting to redirect
   */
  static isRedirectAttempt(url: string, isMlOperation = false): boolean {
    return detectRedirectAttempt(url, isMlOperation);
  }
  
  /**
   * Validate if an endpoint is a valid ML endpoint
   */
  static isValidMlEndpoint(endpoint: string): boolean {
    return validateMlEndpoint(endpoint);
  }
  
  /**
   * Convert absolute URLs to relative for API endpoints
   */
  static toRelativeApiUrl(url: string): string {
    return extractApiPath(url);
  }
  
  /**
   * Fix relative URLs to be absolute when needed
   */
  static toAbsoluteUrl(url: string, baseUrl?: string): string {
    return fixAbsoluteUrl(url, baseUrl);
  }
  
  /**
   * Check if an error is related to CORS or redirects
   */
  static isCorsOrRedirectError(error: any): boolean {
    return isCorsOrRedirectError(error);
  }
  
  /**
   * Return a fully qualified API URL
   */
  static buildApiUrl(endpoint: string): string {
    // Ensure endpoint starts with a slash
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    // For security, always use relative URLs in production
    if (isProduction()) {
      return formattedEndpoint;
    }
    
    // In development, we can use absolute URLs for more flexibility
    return `${getApiBaseUrl()}${formattedEndpoint}`;
  }
}
