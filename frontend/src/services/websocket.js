import { parseToolOutput, identifyAgent, parseAgentOutput } from '../utils/parseAgentOutput'

const METRICS_WS_BASE = 'wss://metrics.studio.lyzr.ai/ws'

/**
 * WebSocket service for real-time agent updates
 */
class WebSocketService {
  constructor() {
    this.ws = null
    this.sessionId = null
    this.listeners = new Set()
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
  }

  /**
   * Connect to WebSocket
   */
  connect(sessionId, apiKey) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.disconnect()
    }

    this.sessionId = sessionId
    const wsUrl = `${METRICS_WS_BASE}/${sessionId}?x-api-key=${apiKey}`

    console.log('🔌 Connecting to WebSocket | Session ID:', sessionId)

    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      this.reconnectAttempts = 0
      this.notifyListeners({ type: 'connected' })
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.handleMessage(data)
      } catch (error) {
        // parse error
      }
    }

    this.ws.onclose = (event) => {
      this.notifyListeners({ type: 'disconnected' })

      // Attempt reconnect if not intentionally closed
      if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        setTimeout(() => {
          this.connect(sessionId, apiKey)
        }, this.reconnectDelay * this.reconnectAttempts)
      }
    }

    this.ws.onerror = (error) => {
      this.notifyListeners({ type: 'error', error })
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  handleMessage(data) {
    // Only process tool_output events
    if (data.event_type === 'tool_output' && data.status === 'success') {
      const toolName = data.tool_name || ''
      const executionTime = data.execution_time

      // Parse the tool output
      const cleanJSON = parseToolOutput(data.tool_output)

      if (cleanJSON) {
        const agentInfo = identifyAgent(toolName)
        const parsedOutput = parseAgentOutput(cleanJSON)

        this.notifyListeners({
          type: 'agent_output',
          agentName: agentInfo.name,
          agentDescription: agentInfo.description,
          toolName: toolName,
          executionTime: executionTime,
          rawData: cleanJSON,
          parsedData: parsedOutput,
          timestamp: data.timestamp
        })
      }
    }

    // Handle other event types
    if (data.event_type === 'agent_start') {
      this.notifyListeners({
        type: 'agent_start',
        agentName: data.agent_name,
        timestamp: data.timestamp
      })
    }

    if (data.event_type === 'agent_end') {
      this.notifyListeners({
        type: 'agent_end',
        agentName: data.agent_name,
        timestamp: data.timestamp
      })
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting')
      this.ws = null
    }
    this.sessionId = null
  }

  /**
   * Add event listener
   */
  addListener(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Remove event listener
   */
  removeListener(callback) {
    this.listeners.delete(callback)
  }

  /**
   * Notify all listeners
   */
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        // listener error
      }
    })
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN
  }
}

// Export singleton instance
export const websocketService = new WebSocketService()

// Export class for testing
export { WebSocketService }
