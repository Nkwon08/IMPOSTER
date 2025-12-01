import { useEffect, useRef, useState } from 'react'

export function useWebSocket(roomCode, onMessage) {
  const wsRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!roomCode) return

    // Use ws://localhost:8000 in development (bypassing Vite proxy for WebSockets)
    // In production, use the same host as the page
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const protocol = isDev ? 'ws:' : (window.location.protocol === 'https:' ? 'wss:' : 'ws:')
    const host = isDev ? 'localhost:8000' : window.location.host
    const wsUrl = `${protocol}//${host}/ws/${roomCode}`
    
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

