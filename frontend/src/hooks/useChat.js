import { useState, useCallback, useRef, useEffect } from 'react'
import { useChatStore } from '../store/chatStore'
import { sendMessage, generateLyzrSessionId, getApiConfig } from '../services/api'
import { websocketService } from '../services/websocket'
import { queryVendors, transformVendorForDisplay } from '../services/mongodb'

/**
 * Hook for chat functionality
 */
export function useChat() {
  const {
    currentChat,
    currentChatId,
    isLoading,
    agentStatus,
    createChat,
    addMessage,
    setLoading,
    setAgentStatus,
    addExecutedAgent,
    clearAgentStatus,
    updateChat,
    setVendors,
    setRfqData,
    showDetailPanel
  } = useChatStore()

  const [sessionId, setSessionId] = useState(null)
  const currentChatIdRef = useRef(currentChatId)

  // Keep ref updated
  useEffect(() => {
    currentChatIdRef.current = currentChatId
  }, [currentChatId])

  // Handle sending a message
  const send = useCallback(async (content) => {
    if (!content.trim()) return

    // Create chat if needed
    let chatId = currentChatIdRef.current
    if (!chatId) {
      chatId = createChat()
      currentChatIdRef.current = chatId
    }

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    }
    addMessage(chatId, userMessage)

    // Generate session ID
    const newSessionId = generateLyzrSessionId()
    setSessionId(newSessionId)

    // Set loading
    setLoading(true)
    setAgentStatus({ currentAgent: 'Manager Agent', isExecuting: true })

    try {
      // Connect WebSocket
      const config = getApiConfig()
      websocketService.connect(newSessionId, config.apiKey)

      // Send message
      const response = await sendMessage(content.trim(), newSessionId)

      // Handle response
      if (response?.response && typeof response.response === 'string') {
        addMessage(chatId, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.response,
          timestamp: new Date().toISOString()
        })
        setLoading(false)
        clearAgentStatus()
      }
    } catch (error) {
      addMessage(chatId, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
        error: true
      })
      setLoading(false)
      clearAgentStatus()
    }
  }, [
    createChat,
    addMessage,
    setLoading,
    setAgentStatus,
    clearAgentStatus
  ])

  return {
    messages: currentChat?.messages || [],
    isLoading,
    agentStatus,
    sessionId,
    send
  }
}

export default useChat
