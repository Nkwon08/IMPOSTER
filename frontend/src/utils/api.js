// API utility for making requests
const API_URL = import.meta.env.VITE_API_URL || ''

export function apiRequest(endpoint, options = {}) {
  const url = API_URL ? `${API_URL}${endpoint}` : endpoint
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
}

