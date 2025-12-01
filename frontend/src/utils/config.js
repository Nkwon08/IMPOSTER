// Get API URL from environment variable or use relative path for development
export const API_URL = import.meta.env.VITE_API_URL || ''

// Helper function to build API endpoint URL
export function getApiUrl(endpoint) {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  
  if (API_URL) {
    // Production: use environment variable
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
    return `${baseUrl}${cleanEndpoint}`
  } else {
    // Development: use relative path (will use Vite proxy)
    return cleanEndpoint
  }
}

// Log configuration on load (for debugging)
if (typeof window !== 'undefined') {
  console.log('API Configuration:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    API_URL: API_URL,
    isProduction: !!API_URL
  })
}

