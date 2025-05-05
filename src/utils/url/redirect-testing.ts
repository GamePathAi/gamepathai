
/**
 * Redirect testing utilities for diagnosing URL issues
 */

/**
 * Define the RedirectTest interface at the beginning of the file
 */
export interface RedirectTest {
  url: string;
  redirected: boolean;
  target?: string;
  isGamePathAI?: boolean;
  status?: number;
  error?: string;
}

/**
 * Test redirects for potential issues
 */
export const testRedirects = async (url: string): Promise<RedirectTest[]> => {
  const results: RedirectTest[] = [];
  
  // Test the URL for redirects
  try {
    const response = await fetch(url, { redirect: 'manual' });
    
    // Check if we got redirected
    if (response.redirected) {
      const redirectTarget = response.url;
      results.push({
        url,
        redirected: true,
        target: redirectTarget,
        isGamePathAI: redirectTarget.includes('gamepathai.com') || redirectTarget.includes('gpai.'),
        status: response.status
      });
      
      // Also test the redirect target recursively to check for redirect chains
      if (redirectTarget !== url) {
        const additionalTests = await testRedirects(redirectTarget);
        results.push(...additionalTests);
      }
    } else {
      // Check response for suspicious behavior
      const responseStatus = response.status;
      const contentType = response.headers.get('content-type');
      const hasHtmlContent = contentType && contentType.includes('text/html');
      
      // Clone the response to read its body
      const responseBody = hasHtmlContent ? await response.text() : '';
      
      // Look for redirect patterns in HTML (meta refresh, JS redirects)
      const hasMetaRefresh = responseBody.includes('http-equiv="refresh"');
      const hasJsRedirect = responseBody.includes('window.location') || 
                          responseBody.includes('document.location');
      
      if (hasMetaRefresh || hasJsRedirect) {
        results.push({
          url,
          redirected: true,
          target: 'Client-side redirect detected',
          isGamePathAI: false,
          status: responseStatus
        });
      } else {
        // No redirect detected
        results.push({
          url,
          redirected: false,
          status: responseStatus
        });
      }
      
      // Parse and analyze API response for diagnostics if it's likely JSON
      if (contentType && contentType.includes('application/json')) {
        try {
          // Parse JSON response with type checking
          const responseData = await response.json();
          
          // Make sure responseData is not null and is an object before accessing properties
          if (responseData !== null && typeof responseData === 'object') {
            // Now it's safe to cast to a record type and access properties
            const responseJson = responseData as Record<string, unknown>;
            
            // Check for API-level redirect indicators using the in operator for type safety
            if ('redirect' in responseJson || 'location' in responseJson) {
              const redirectTarget = String(responseJson.redirect || responseJson.location || 'API redirect');
              results.push({
                url,
                redirected: true,
                target: redirectTarget,
                isGamePathAI: false,
                status: responseStatus
              });
            }
          }
        } catch (e) {
          console.error('Error parsing JSON in diagnostics:', e);
        }
      }
    }
  } catch (error) {
    console.error('Error testing URL:', error);
    results.push({
      url,
      redirected: false,
      status: 0,
      error: 'Connection error'
    });
  }
  
  return results;
};
