import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../../store/chatStore'
import { sendMessage, getApiConfig, generateLyzrSessionId, callPricingSuggestionAgent } from '../../services/api'
import { websocketService } from '../../services/websocket'
import { queryVendors, transformVendorForDisplay } from '../../services/mongodb'
import MessageList from '../chat/MessageList'
import ChatInput from '../chat/ChatInput'
import AgentStatus from '../chat/AgentStatus'
import WelcomeScreen from '../chat/WelcomeScreen'

export default function ChatArea({ viewMode = 'customer', onVendorClick }) {
  const {
    chats,
    currentChat,
    currentChatId,
    isLoading,
    agentStatus,
    isDetailPanelOpen,
    detailPanelType,
    createChat,
    addMessage,
    updateMessage,
    setLoading,
    setAgentStatus,
    addExecutedAgent,
    clearAgentStatus,
    updateChat,
    setVendors,
    setRfqData,
    setRfpData,
    setContractData,
    setPricingLoading,
    showDetailPanel
  } = useChatStore()

  const messagesEndRef = useRef(null)
  const requestCountersRef = useRef({ DATABASE_QUERY: 0, RFQ_REQUEST: 0, RFP_REQUEST: 0, CONTRACT_REQUEST: 0, GENERAL_CHAT: 0 })
  const shouldCallPricingRef = useRef(false)

  // Loading message variations based on request type
  const getLoadingMessage = (conversationType) => {
    const count = requestCountersRef.current[conversationType] || 0
    
    if (conversationType === 'DATABASE_QUERY') {
      const messages = [
        'Please wait, I am searching the database for you...',
        'Searching vendor database, just a moment...',
        'Let me find the best vendors for you...',
        'Querying database for matching vendors...',
        'Searching for available vendors...'
      ]
      return messages[count % messages.length]
    } else if (conversationType === 'RFQ_REQUEST') {
      const messages = [
        'I will help you fill the form...',
        'Let me help you complete the RFQ form...',
        'I\'m expecting your details from the provided context...',
        'Preparing RFQ form for you...',
        'Let me gather the necessary information for your RFQ...'
      ]
      return messages[count % messages.length]
    } else if (conversationType === 'RFP_REQUEST') {
      const messages = [
        'I will help you fill the RFP form...',
        'Let me help you complete the RFP form...',
        'Preparing RFP form with your details...',
        'Gathering information for your RFP...',
        'Setting up the RFP form for you...'
      ]
      return messages[count % messages.length]
    } else if (conversationType === 'CONTRACT_REQUEST') {
      const messages = [
        'I will help you fill the contract form...',
        'Let me prepare the contract details...',
        'Setting up the contract form for you...',
        'Gathering contract information...',
        'Preparing contract form with your details...'
      ]
      return messages[count % messages.length]
    } else if (conversationType === 'GENERAL_CHAT') {
      // Check user's last message for context-aware loading text
      const lastUserMsg = (currentChat?.messages || []).filter(m => m.role === 'user').pop()?.content?.toLowerCase() || ''

      if (/chart|graph|pie|bar|visuali|plot|breakdown/.test(lastUserMsg)) {
        const msgs = [
          'Let me visualize that for you...',
          'Generating a chart from your data...',
          'Building a visual breakdown...',
          'Preparing your visualization...',
          'Crunching numbers and creating a chart...'
        ]
        return msgs[count % msgs.length]
      }
      if (/contract|agreement|term/.test(lastUserMsg)) {
        const msgs = [
          'Let me pull up the contract details...',
          'Fetching contract records for you...',
          'Searching through contract history...',
          'Analyzing contract data...',
          'Reviewing agreements and terms...'
        ]
        return msgs[count % msgs.length]
      }
      if (/vendor|supplier|provider/.test(lastUserMsg)) {
        const msgs = [
          'Looking up vendor information...',
          'Searching vendor records...',
          'Gathering vendor details for you...',
          'Pulling vendor data from our records...',
          'Analyzing vendor profiles...'
        ]
        return msgs[count % msgs.length]
      }
      if (/spend|cost|budget|price|expense/.test(lastUserMsg)) {
        const msgs = [
          'Analyzing spend data for you...',
          'Crunching the numbers...',
          'Pulling financial records...',
          'Reviewing cost breakdowns...',
          'Gathering spend insights...'
        ]
        return msgs[count % msgs.length]
      }
      const messages = [
        'Let me look into that for you...',
        'Analyzing your request...',
        'Gathering the information you need...',
        'Working on your query...',
        'Let me find that out for you...'
      ]
      return messages[count % messages.length]
    }
    return 'Processing your request...'
  }

  // Initialize WebSocket when switching to a chat with a sessionId
  useEffect(() => {
    const chatSessionId = currentChat?.sessionId
    if (chatSessionId) {
      const config = getApiConfig()
      websocketService.connect(chatSessionId, config.apiKey)

      const unsubscribe = websocketService.addListener(handleWebSocketEvent)

      return () => {
        unsubscribe()
        websocketService.disconnect()
      }
    }
  }, [currentChat?.sessionId])

  // Handle WebSocket events
  const handleWebSocketEvent = useCallback((event) => {
    if (!currentChatId) return

    switch (event.type) {
      case 'agent_output':
        // Mark this agent as completed, keep executing state for next agent
        addExecutedAgent({
          name: event.agentName,
          executionTime: event.executionTime,
          timestamp: event.timestamp
        })

        // Process parsed data
        if (event.parsedData) {
          handleParsedAgentOutput(event.parsedData)
        }
        break

      case 'agent_start':
        setAgentStatus({
          currentAgent: event.agentName,
          isExecuting: true
        })
        break

      case 'agent_end':
        // Don't clear isExecuting here - let the next agent_start or API completion handle it
        setAgentStatus({
          currentAgent: null
        })
        break

      case 'connected':
      case 'disconnected':
      case 'error':
        break
    }
  }, [currentChatId, currentChat?.sessionId])

  // Handle parsed agent output
  const handleParsedAgentOutput = async (parsedData) => {
    if (!currentChatId) {
      console.log('[ChatArea] ❌ handleParsedAgentOutput - No currentChatId')
      return
    }

    console.log('[ChatArea] 📊 handleParsedAgentOutput called with type:', parsedData?.type)

    switch (parsedData.type) {
      case 'decision':
        // Update conversation type
        const conversationType = parsedData.decision.replace(' ', '_').toUpperCase()
        updateChat(currentChatId, { conversationType })

        // Increment counter for this request type
        requestCountersRef.current[conversationType] = (requestCountersRef.current[conversationType] || 0) + 1

        // Get loading message based on type and occurrence
        const loadingMessage = getLoadingMessage(conversationType)

        // Add loading message and show detail panel based on decision
        if (conversationType === 'DATABASE_QUERY') {
          addMessage(currentChatId, {
            id: `action-${Date.now()}`,
            role: 'assistant',
            content: loadingMessage,
            timestamp: new Date().toISOString(),
            actionType: 'vendors',
            actionComplete: false
          })
          // Only open panel if not already open with same type
          if (!isDetailPanelOpen || detailPanelType !== 'vendors') {
            showDetailPanel('vendors')
          }
        } else if (conversationType === 'RFQ_REQUEST') {
          addMessage(currentChatId, {
            id: `action-${Date.now()}`,
            role: 'assistant',
            content: loadingMessage,
            timestamp: new Date().toISOString(),
            actionType: 'rfq',
            actionComplete: false
          })
          // Only open panel if not already open with same type
          if (!isDetailPanelOpen || detailPanelType !== 'rfq') {
            showDetailPanel('rfq')
          }
          
          // Mark that we should call pricing agent when RFQ data arrives
          // Use a refs approach for more reliable flag passing
          shouldCallPricingRef.current = true
        } else if (conversationType === 'RFP_REQUEST') {
          addMessage(currentChatId, {
            id: `action-${Date.now()}`,
            role: 'assistant',
            content: loadingMessage,
            timestamp: new Date().toISOString(),
            actionType: 'rfp',
            actionComplete: false
          })
          if (!isDetailPanelOpen || detailPanelType !== 'rfp') {
            showDetailPanel('rfp')
          }
        } else if (conversationType === 'CONTRACT_REQUEST') {
          addMessage(currentChatId, {
            id: `action-${Date.now()}`,
            role: 'assistant',
            content: loadingMessage,
            timestamp: new Date().toISOString(),
            actionType: 'contract',
            actionComplete: false
          })
          if (!isDetailPanelOpen || detailPanelType !== 'contract') {
            showDetailPanel('contract')
          }
        } else if (conversationType === 'GENERAL_CHAT') {
          addMessage(currentChatId, {
            id: `action-${Date.now()}`,
            role: 'assistant',
            content: loadingMessage,
            timestamp: new Date().toISOString(),
            actionComplete: false
          })
        }
        break

      case 'chart_data':
        console.log('[ChatArea] ✅ CHART_DATA case triggered')
        console.log('[ChatArea] Chart Data:', JSON.stringify(parsedData.chartData)?.substring(0, 500))
        console.log('[ChatArea] Chart Type:', parsedData.chartData?.chart_type)
        console.log('[ChatArea] Chart Title:', parsedData.chartData?.title)
        if (parsedData.chartData?.chart_type === 'text') {
          console.log('[ChatArea] 📄 TEXT CHART - Data length:', parsedData.chartData?.data?.length)
          console.log('[ChatArea] 📄 TEXT CHART - Data preview:', parsedData.chartData?.data?.substring(0, 200))
        }
        console.log('[ChatArea] Adding message to chat...')
        addMessage(currentChatId, {
          id: `chart-${Date.now()}`,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
          chartData: parsedData.chartData
        })
        console.log('[ChatArea] ✅ Message added successfully')
        break

      case 'general_chat':
        addMessage(currentChatId, {
          id: Date.now().toString(),
          role: 'assistant',
          content: parsedData.response,
          timestamp: new Date().toISOString()
        })
        break

      case 'internal_vendor_query':
        // Query MongoDB with the vendor names and categories
        try {
          const results = await queryVendors({
            vendorNames: parsedData.vendorNames,
            categories: parsedData.categories
          })
          const transformedVendors = results.map(transformVendorForDisplay)
          setVendors(currentChatId, transformedVendors, 'internal')

          // Mark the vendors action card as complete
          const vendorActionMsg = currentChat?.messages?.find(m => m.actionType === 'vendors' && !m.actionComplete)
          if (vendorActionMsg) {
            updateMessage(currentChatId, vendorActionMsg.id, { actionComplete: true })
          }
        } catch (error) {
          // query error
        }
        break

      case 'external_vendors':
        // Set external vendors from Perplexity
        setVendors(currentChatId, parsedData.vendors, 'external')

        // Show vendors panel if not already visible
        if (!isDetailPanelOpen || detailPanelType !== 'vendors') {
          showDetailPanel('vendors')
        }

        // Mark the vendors action card as complete
        const extVendorActionMsg = currentChat?.messages?.find(m => m.actionType === 'vendors' && !m.actionComplete)
        if (extVendorActionMsg) {
          updateMessage(currentChatId, extVendorActionMsg.id, { actionComplete: true })
        }
        break

      case 'rfq_data': {
        // Set RFQ form data
        setRfqData(currentChatId, parsedData)

        // Mark the RFQ action card as complete
        const rfqActionMsg = currentChat?.messages?.find(m => m.actionType === 'rfq' && !m.actionComplete)
        if (rfqActionMsg) {
          updateMessage(currentChatId, rfqActionMsg.id, { actionComplete: true })
        }

        // Call pricing API if RFQ_REQUEST decision was made (using ref for reliable flag)
        if (shouldCallPricingRef.current && parsedData.requirementSummary) {
          // Set loading state IMMEDIATELY
          setPricingLoading(currentChatId, true)
          
          try {
            const pricingResponse = await callPricingSuggestionAgent({
              requirementSummary: parsedData.requirementSummary,
              budgetRange: parsedData.budgetRange,
              procurementType: parsedData.procurementType,
              item: parsedData.procurementType,
              quantity: parsedData.quantity
            })
            
            if (pricingResponse?.price) {
              
              // Update RFQ data with suggested pricing
              const updatedRfqData = {
                ...parsedData,
                suggestedPrice: pricingResponse.price,
                suggestedCurrency: pricingResponse.currency || 'USD'
              }
              setRfqData(currentChatId, updatedRfqData)
            }
          } catch (error) {
            // pricing error
          } finally {
            setPricingLoading(currentChatId, false)
            // Clear the flag
            shouldCallPricingRef.current = false
          }
        }
        break
      }

      case 'rfp_data': {

        // Auto-generate RFP ID if not provided
        if (!parsedData.rfpId) {
          const now = new Date()
          const datePart = now.toISOString().slice(0, 10).replace(/-/g, '')
          const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase()
          parsedData.rfpId = `RFP-${datePart}-${randomPart}`
        }

        setRfpData(currentChatId, parsedData)

        // Mark the RFP action card as complete
        const rfpActionMsg = currentChat?.messages?.find(m => m.actionType === 'rfp' && !m.actionComplete)
        if (rfpActionMsg) {
          updateMessage(currentChatId, rfpActionMsg.id, { actionComplete: true })
        }

        // Display message_to_customer or message as a chat message
        const rfpMsg = parsedData.messageToCustomer || parsedData.message
        if (rfpMsg) {
          addMessage(currentChatId, {
            id: `rfp-message-${Date.now()}`,
            role: 'assistant',
            content: rfpMsg,
            timestamp: new Date().toISOString()
          })
        }
        break
      }

      case 'contract_data': {
        setContractData(currentChatId, parsedData)

        // Mark the contract action card as complete
        const contractActionMsg = currentChat?.messages?.find(m => m.actionType === 'contract' && !m.actionComplete)
        if (contractActionMsg) {
          updateMessage(currentChatId, contractActionMsg.id, { actionComplete: true })
        }
        break
      }

      case 'manager_response': {
        console.log('[ChatArea] manager_response received:', typeof parsedData.response, JSON.stringify(parsedData.response)?.substring(0, 500))
        // Check if the manager response contains chart JSON
        let chartData = null

        // Response is already a parsed object
        if (parsedData.response && typeof parsedData.response === 'object' && parsedData.response.chart_type && ['pie', 'bar', 'line', 'text'].includes(parsedData.response.chart_type)) {
          console.log('[ChatArea] manager_response is chart object:', parsedData.response.chart_type)
          chartData = parsedData.response
        }
        // Response is a JSON string
        else if (typeof parsedData.response === 'string') {
          try {
            const parsed = JSON.parse(parsedData.response)
            if (parsed?.chart_type && ['pie', 'bar', 'line', 'text'].includes(parsed.chart_type)) {
              console.log('[ChatArea] manager_response contains chart string:', parsed.chart_type)
              chartData = parsed
            }
          } catch (err) {
            console.log('[ChatArea] manager_response not chart JSON:', err.message)
          }
        }

        if (chartData) {
          addMessage(currentChatId, {
            id: `chart-${Date.now()}`,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            chartData,
            agentsUsed: parsedData.agentsCalledSequence
          })
        } else {
          addMessage(currentChatId, {
            id: Date.now().toString(),
            role: 'assistant',
            content: parsedData.response,
            timestamp: new Date().toISOString(),
            agentsUsed: parsedData.agentsCalledSequence
          })
        }
        break
      }

      default:
        break
    }

    // Generic: display agent "message" field in chat (if present and not already handled)
    if (parsedData.message && parsedData.type !== 'rfp_data') {
      addMessage(currentChatId, {
        id: `agent-msg-${Date.now()}`,
        role: 'assistant',
        content: parsedData.message,
        timestamp: new Date().toISOString()
      })
    }
  }

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentChat?.messages])

  // Handle send message
  const handleSendMessage = async (content, assetId) => {
    if (!content.trim()) return

    // Create chat if none exists
    let chatId = currentChatId
    if (!chatId) {
      chatId = createChat()
    }

    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString()
    }
    addMessage(chatId, userMessage)

    // Use the chat's persistent session ID, or generate one if missing (old chats / just-created chat)
    let chatSessionId = chats[chatId]?.sessionId
    if (!chatSessionId) {
      chatSessionId = generateLyzrSessionId()
      updateChat(chatId, { sessionId: chatSessionId })
    }

    console.log('Session ID:', chatSessionId)

    // Set loading state
    setLoading(true)
    setAgentStatus({ currentAgent: null, isExecuting: true })

    try {
      // Send to LYZR API - response is handled via WebSocket
      // Pass asset IDs if provided
      const assets = assetId ? [assetId] : []
      await sendMessage(content.trim(), chatSessionId, assets)

      // API call resolved = manager agent is done
      // Clear loading state
      setLoading(false)
      clearAgentStatus()

    } catch (error) {
      addMessage(chatId, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        error: true
      })
      setLoading(false)
      clearAgentStatus()
    }
  }

  // Handle quick action
  const handleQuickAction = (action) => {
    const messages = {
      'show-vendors': 'Show me all active vendors',
      'create-rfq': 'I want to create an RFQ for procurement of goods and services',
      'create-rfp': 'I want to create an RFP for a new project',
      'create-contract': 'I want to create a contract for a vendor agreement'
    }
    handleSendMessage(messages[action] || action)
  }

  // Handle action card click (opens detail panel)
  const handleActionClick = useCallback((actionType) => {
    showDetailPanel(actionType)
  }, [showDetailPanel])

  // Handle file uploaded
  const handleFileUploaded = (fileInfo) => {
    // Create chat if none exists
    let chatId = currentChatId
    if (!chatId) {
      chatId = createChat()
    }

    // Add file upload message to chat
    const fileMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: '',
      timestamp: new Date().toISOString(),
      fileUpload: {
        name: fileInfo.name,
        size: fileInfo.size,
        type: fileInfo.type,
        assetId: fileInfo.assetId
      }
    }
    addMessage(chatId, fileMessage)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-lyzr-white-amber">
      {/* Header */}
      <header className="px-6 py-4 border-b border-lyzr-cream bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-playfair text-xl font-semibold text-lyzr-congo">
              {currentChat?.title || 'Procurement Hub'}
            </h1>
            {currentChat?.conversationType && (
              <span className="text-xs text-lyzr-mid-4 mt-0.5 capitalize">
                {currentChat.conversationType.replace('_', ' ').toLowerCase()}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
        {!currentChat || currentChat.messages.length === 0 ? (
          <WelcomeScreen onQuickAction={handleQuickAction} />
        ) : (
          <div className="max-w-4xl mx-auto px-6 py-6">
            <MessageList messages={currentChat.messages} onActionClick={handleActionClick} onVendorClick={onVendorClick} />

            {/* Agent Status - Show while loading */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4"
                >
                  <AgentStatus
                    currentAgent={agentStatus.currentAgent}
                    executedAgents={agentStatus.executedAgents}
                    isExecuting={isLoading}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-lyzr-cream bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto">
          <ChatInput
            onSend={handleSendMessage}
            onFileUploaded={handleFileUploaded}
            disabled={isLoading}
            placeholder="Ask anything..."
          />
          <p className="text-xs text-center text-lyzr-mid-4 mt-2">
            Enter to send
          </p>
        </div>
      </div>
    </div>
  )
}
