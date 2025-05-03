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
    const base = baseUrl || window.location.origin;
    return base + url;
  }
  
  // Otherwise, it's a relative path, add a slash and prepend the base URL
  const base = baseUrl || window.location.origin;
  return base + '/' + url;
};

/**
 * Sanitizes a URL to prevent XSS attacks and ensures it's properly formatted
 * @param url URL to sanitize
 */
export const sanitizeApiUrl = (url: string): string => {
  // Trim whitespace and remove null bytes
  let sanitized = url.trim().replace(/\0/g, '');
  
  // Remove any javascript: protocol URLs
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove data: URLs
  sanitized = sanitized.replace(/data:/gi, '');
  
  // Ensure we have a valid URL
  try {
    new URL(sanitized);
  } catch (e) {
    // If not a valid URL, assume it's a relative path
    sanitized = fixAbsoluteUrl(sanitized);
  }
  
  return sanitized;
};
