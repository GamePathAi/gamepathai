
/**
 * Examples of using URL utilities in the application
 * This file serves as documentation and is not meant to be imported
 */

import { UrlUtility } from './UrlUtility';
import { secureFetch } from './ApiInterceptor';

// Example 1: Initialize URL protection
const initializeApp = () => {
  // Set up redirect protection
  UrlUtility.initializeProtection();
  
  console.log('URL protection initialized');
};

// Example 2: Making secure API requests
const fetchUserData = async () => {
  try {
    // Using the secure fetch utility
    const userData = await secureFetch('/api/user/profile', {
      method: 'GET',
      timeoutMs: 5000
    });
    
    return userData;
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    throw error;
  }
};

// Example 3: Making ML-specific API requests with higher security
const fetchMlPrediction = async (gameId: string) => {
  try {
    // Using secure fetch with ML operation flag
    const prediction = await secureFetch(`/api/ml/predict/${gameId}`, {
      method: 'POST',
      isMlOperation: true, // Enables stricter security checks
      timeoutMs: 10000
    });
    
    return prediction;
  } catch (error) {
    console.error('ML prediction failed:', error);
    throw error;
  }
};

// Example 4: Validating URLs before use
const navigateToUrl = (url: string) => {
  // Check if URL is safe before navigation
  if (!UrlUtility.isSafe(url)) {
    console.error('Blocked navigation to potentially unsafe URL:', url);
    return false;
  }
  
  // URL is safe, proceed with navigation
  window.location.href = url;
  return true;
};

// Example 5: Working with relative and absolute URLs
const buildResourceUrl = (path: string) => {
  // For API requests, ensure relative paths
  if (path.includes('/api/') || path.includes('/ml/')) {
    return UrlUtility.toRelativeApiUrl(path);
  }
  
  // For other resources, use absolute URLs
  return UrlUtility.toAbsoluteUrl(path);
};

// Don't export anything, this file is just for documentation
