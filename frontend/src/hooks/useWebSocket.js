import { useEffect, useCallback, useRef, useState } from 'react'
import { websocketService } from '../services/websocket'
import { getApiConfig } from '../services/api'

/**
 * Hook for WebSocket connection management
 */
export function useWebSocket(sessionId, onMessage) {
  const [isConnected, setIsConnected] = useState(false)
  const onMessageRef = useRef(onMessage)

  // Update ref on change
  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  // Connect/disconnect on session change
  useEffect(() => {
    if (!sessionId) {
      setIsConnected(false)
      return
    }

    const config = getApiConfig()
    websocketService.connect(sessionId, config.apiKey)

    const unsubscribe = websocketService.addListener((event) => {
      if (event.type === 'connected') {
        setIsConnected(true)
      } else if (event.type === 'disconnected') {
        setIsConnected(false)
      }

      onMessageRef.current?.(event)
    })

    return () => {
      unsubscribe()
      websocketService.disconnect()
    }
  }, [sessionId])

  const disconnect = useCallback(() => {
    websocketService.disconnect()
    setIsConnected(false)
  }, [])

  return {
    isConnected,
    disconnect
  }
}

export default useWebSocket
