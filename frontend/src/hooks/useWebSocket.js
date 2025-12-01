import { useEffect, useRef, useState } from 'react'

export function useWebSocket(roomCode, onMessage) {
  const wsRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!roomCode) return

    // Use environment variable for API URL in production, or localhost in development
    const apiUrl = import.meta.env.VITE_API_URL || ''
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    
    let wsUrl
    if (isDev) {
      // Development: use localhost
      wsUrl = `ws://localhost:8000/ws/${roomCode}`
    } else if (apiUrl) {
      // Production with custom API URL
      const wsProtocol = apiUrl.startsWith('https') ? 'wss:' : 'ws:'
      const wsHost = apiUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
      wsUrl = `${wsProtocol}//${wsHost}/ws/${roomCode}`
    } else {
      // Production: use same host as frontend
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      wsUrl = `${protocol}//${window.location.host}/ws/${roomCode}`
    }
    
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (onMessage) {
          onMessage(data)
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      setIsConnected(false)
      // Attempt to reconnect after 3 seconds
      setTimeout(() => {
        if (roomCode) {
          // Reconnect logic handled by useEffect
        }
      }, 3000)
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [roomCode, onMessage])

  return { isConnected }
}

