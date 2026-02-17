import { parseToolOutput, identifyAgent, parseAgentOutput } from '../utils/parseAgentOutput'

const METRICS_WS_BASE = import.meta.env.VITE_LYZR_WS_URL || 'wss://metrics.studio.lyzr.ai/ws'

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

      console.log('[WebSocket] ✅ INCOMING tool_output event')
      console.log('[WebSocket] Tool Name:', toolName)
      console.log('[WebSocket] Raw tool_output type:', typeof data.tool_output)
      console.log('[WebSocket] Raw tool_output length:', data.tool_output?.length || 0)
      
      const toolStr = String(data.tool_output)
      console.log('[WebSocket] After String() conversion:')
      console.log('[WebSocket] String length:', toolStr.length)
      console.log('[WebSocket] Starts with?', toolStr[0])
      console.log('[WebSocket] First 300 chars:', toolStr.substring(0, 300))
      console.log('[WebSocket] Last 150 chars:', toolStr.substring(Math.max(0, toolStr.length - 150)))

      // Parse the tool output
      let cleanJSON = parseToolOutput(toolStr)
      console.log('[WebSocket] ✅ AFTER parseToolOutput:', cleanJSON ? 'SUCCESS - Got JSON' : 'FAILED - Returned null')
      if (cleanJSON) {
        console.log('[WebSocket] Parsed JSON chart_type:', cleanJSON.chart_type)
        console.log('[WebSocket] Parsed JSON title:', cleanJSON.title)
        if (cleanJSON.chart_type === 'text') {
          console.log('[WebSocket] 📄 TEXT CHART DETECTED')
          console.log('[WebSocket] Data preview:', cleanJSON.data?.substring(0, 300))
          console.log('[WebSocket] Contains HTML tags:', cleanJSON.data?.includes('<a href'))
        }
      } else {
        console.log('[WebSocket] ❌ parseToolOutput returned null')
      }

      if (cleanJSON) {
        const agentInfo = identifyAgent(toolName)
        console.log('[WebSocket] 📊 PARSING with parseAgentOutput')
        const parsedOutput = parseAgentOutput(cleanJSON)
        console.log('[WebSocket] ✅ parseAgentOutput result:', parsedOutput?.type)
        if (parsedOutput?.type === 'chart_data') {
          console.log('[WebSocket] ✅ CHART DATA IDENTIFIED')
          console.log('[WebSocket] Chart Type:', parsedOutput.chartData?.chart_type)
          if (parsedOutput.chartData?.chart_type === 'text') {
            console.log('[WebSocket] 📄 TEXT CHART WILL BE SENT')
            console.log('[WebSocket] Text data length:', parsedOutput.chartData?.data?.length)
          }
        } else {
          console.log('[WebSocket] ⚠️  NOT chart_data, type is:', parsedOutput?.type)
        }

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
      } else {
        console.log('[WebSocket] ❌ NO CLEAN JSON - parseToolOutput failed')
      }
    }

    // Handle other event types
    if (data.event_type === 'agent_start') {
      console.log('[WebSocket] 🟢 agent_start:', data.agent_name)
      this.notifyListeners({
        type: 'agent_start',
        agentName: data.agent_name,
        timestamp: data.timestamp
      })
    }

    if (data.event_type === 'agent_end') {
      console.log('[WebSocket] 🔴 agent_end:', data.agent_name)
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
