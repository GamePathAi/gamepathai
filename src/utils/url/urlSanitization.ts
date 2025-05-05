/**
 * URL sanitization utilities
 */

/**
 * Converts relative URLs to absolute URLs if needed
 * @param url The URL to fix
 * @param baseUrl Optional base URL to use
 */
export const fixAbsoluteUrl = (url: string, baseUrl?: string): string => {
  if (!url) return '';
  
  // If the URL is already absolute, return it
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If URL starts with a slash, prepend the base URL
  if (url.startsWith('/')) {
    const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
    return base + url;
  }
  
  // Otherwise, it's a relative path, add a slash and prepend the base URL
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return base + '/' + url;
};

/**
 * Sanitizes a URL to prevent XSS attacks and ensures it's properly formatted
 * @param url URL to sanitize
 */
export const sanitizeApiUrl = (url: string): string => {
  if (typeof url !== 'string') return '';
  
  // Trim whitespace and remove null bytes
  let sanitized = url.trim().replace(/\0/g, '');
  
  // Remove any javascript: protocol URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: URLs
  sanitized = sanitized.replace(/data:/gi, '');
  
  // For API endpoints, convert absolute URLs to relative when possible
  if (sanitized.includes('/api/') || sanitized.includes('/ml/')) {
    try {
      if (sanitized.startsWith('http')) {
        const urlObj = new URL(sanitized);
        return urlObj.pathname + urlObj.search;
      }
    } catch (e) {
      console.error('Error sanitizing API URL:', e);
    }
  }
  
  return sanitized;
};

/**
 * Extracts the relative path from an absolute URL if it's an API endpoint
 */
export const extractApiPath = (url: string): string => {
  if (!url) return '';
  
  // If it's already a relative path, return it
  if (url.startsWith('/')) return url;
  
  try {
    // If it's an absolute URL with an API path, extract just the path
    if (url.includes('http') && 
       (url.includes('/api/') || url.includes('/ml/'))) {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    }
  } catch (e) {
    console.error('Error extracting API path:', e);
  }
  
  // Return the original URL if we couldn't extract an API path
  return url;
};
