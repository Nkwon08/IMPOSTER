// Get API URL from environment variable or use relative path for development
export const API_URL = import.meta.env.VITE_API_URL || ''

// Helper function to build API endpoint URL
export function getApiUrl(endpoint) {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return API_URL ? `${API_URL}${cleanEndpoint}` : cleanEndpoint
}

