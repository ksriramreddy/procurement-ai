import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../../store/chatStore'
import { sendMessage, generateLyzrSessionId, getApiConfig, callPricingSuggestionAgent } from '../../services/api'
import { websocketService } from '../../services/websocket'
import { queryVendors, transformVendorForDisplay } from '../../services/mongodb'
import MessageList from '../chat/MessageList'
import ChatInput from '../chat/ChatInput'
import AgentStatus from '../chat/AgentStatus'
import WelcomeScreen from '../chat/WelcomeScreen'

export default function ChatArea() {
  const {
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
    setPricingLoading,
    showDetailPanel
  } = useChatStore()

  const [sessionId, setSessionId] = useState(null)
  const messagesEndRef = useRef(null)
  const requestCountersRef = useRef({ DATABASE_QUERY: 0, RFQ_REQUEST: 0, GENERAL_CHAT: 0 })
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
    } else if (conversationType === 'GENERAL_CHAT') {
      const messages = [
        'Processing your request...',
        'Let me think about that...',
        'Analyzing your query...',
        'Getting you the answer...',
        'Working on your request...'
      ]
      return messages[count % messages.length]
    }
    return 'Processing your request...'
  }

  // Initialize WebSocket when a new session starts
  useEffect(() => {
    if (sessionId) {
      const config = getApiConfig()
      websocketService.connect(sessionId, config.apiKey)

      const unsubscribe = websocketService.addListener(handleWebSocketEvent)

      return () => {
        unsubscribe()
        websocketService.disconnect()
      }
    }
  }, [sessionId])

  // Handle WebSocket events
  const handleWebSocketEvent = useCallback((event) => {
    if (!currentChatId) return

    switch (event.type) {
      case 'agent_output':
        console.log('📦 Agent output:', event.agentName, event.toolName)

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
        console.log('🚀 Agent started:', event.agentName)
        setAgentStatus({
          currentAgent: event.agentName,
          isExecuting: true
        })
        break

      case 'agent_end':
        console.log('✅ Agent completed:', event.agentName)
        // Don't clear isExecuting here - let the next agent_start or API completion handle it
        setAgentStatus({
          currentAgent: null
        })
        break

      case 'connected':
        console.log('🔌 WebSocket CONNECTED for session:', sessionId)
        break

      case 'disconnected':
        console.log('🔌 WebSocket DISCONNECTED')
        break

      case 'error':
        console.error('❌ WebSocket ERROR:', event.error)
        break
    }
  }, [currentChatId, sessionId])

  // Handle parsed agent output
  const handleParsedAgentOutput = async (parsedData) => {
    if (!currentChatId) return

    console.log('\n📋 PROCESSING PARSED DATA - Type:', parsedData.type)

    switch (parsedData.type) {
      case 'decision':
        // Update conversation type
        const conversationType = parsedData.decision.replace(' ', '_').toUpperCase()
        console.log('🎯 CHAT DECISION MAKER OUTPUT:')
        console.log('   Decision:', parsedData.decision)
        console.log('   Conversation Type:', conversationType)
        updateChat(currentChatId, { conversationType })

        // Increment counter for this request type
        requestCountersRef.current[conversationType] = (requestCountersRef.current[conversationType] || 0) + 1

        // Get loading message based on type and occurrence
        const loadingMessage = getLoadingMessage(conversationType)

        // Add loading message and show detail panel based on decision
        if (conversationType === 'DATABASE_QUERY') {
          console.log('   → Adding Vendor Search loading message')
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
          console.log('   → Adding RFQ Creation loading message')
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
        } else if (conversationType === 'GENERAL_CHAT') {
          console.log('   → Adding General Chat loading message')
          addMessage(currentChatId, {
            id: `action-${Date.now()}`,
            role: 'assistant',
            content: loadingMessage,
            timestamp: new Date().toISOString(),
            actionComplete: false
          })
        }
        break

      case 'general_chat':
        console.log('💬 General chat response received')
        addMessage(currentChatId, {
          id: Date.now().toString(),
          role: 'assistant',
          content: parsedData.response,
          timestamp: new Date().toISOString()
        })
        break

      case 'internal_vendor_query':
        console.log('🔍 INTERNAL VENDOR FETCHER OUTPUT:')
        console.log('   Vendor Names:', parsedData.vendorNames)
        console.log('   Categories:', parsedData.categories)
        // Query MongoDB with the vendor names and categories
        try {
          const results = await queryVendors({
            vendorNames: parsedData.vendorNames,
            categories: parsedData.categories
          })
          const transformedVendors = results.map(transformVendorForDisplay)
          console.log('   → Found', transformedVendors.length, 'internal vendors')
          setVendors(currentChatId, transformedVendors, 'internal')

          // Mark the vendors action card as complete
          const vendorActionMsg = currentChat?.messages?.find(m => m.actionType === 'vendors' && !m.actionComplete)
          if (vendorActionMsg) {
            updateMessage(currentChatId, vendorActionMsg.id, { actionComplete: true })
          }
        } catch (error) {
          console.error('Failed to query vendors:', error)
        }
        break

      case 'external_vendors':
        console.log('🌐 EXTERNAL VENDOR FETCHER OUTPUT:')
        console.log('   Found', parsedData.vendors?.length || 0, 'external vendors')
        parsedData.vendors?.forEach((v, i) => {
          console.log(`   ${i + 1}. ${v.name} - ${v.website}`)
        })
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
        console.log('📋 RFQ Data received')
        // Set RFQ form data
        setRfqData(currentChatId, parsedData)

        // Mark the RFQ action card as complete
        const rfqActionMsg = currentChat?.messages?.find(m => m.actionType === 'rfq' && !m.actionComplete)
        if (rfqActionMsg) {
          updateMessage(currentChatId, rfqActionMsg.id, { actionComplete: true })
        }

        // Call pricing API if RFQ_REQUEST decision was made (using ref for reliable flag)
        if (shouldCallPricingRef.current && parsedData.requirementSummary) {
          console.log('💰 Calling pricing suggestion agent with RFQ data...')
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
              console.log('💰 Pricing suggestion received:', pricingResponse.price)
              
              // Update RFQ data with suggested pricing
              const updatedRfqData = {
                ...parsedData,
                suggestedPrice: pricingResponse.price,
                suggestedCurrency: pricingResponse.currency || 'USD'
              }
              setRfqData(currentChatId, updatedRfqData)
            }
          } catch (error) {
            console.error('❌ Failed to get pricing suggestion:', error)
          } finally {
            setPricingLoading(currentChatId, false)
            // Clear the flag
            shouldCallPricingRef.current = false
          }
        }
        break
      }

      case 'manager_response':
        console.log('🤖 Manager response received')
        addMessage(currentChatId, {
          id: Date.now().toString(),
          role: 'assistant',
          content: parsedData.response,
          timestamp: new Date().toISOString(),
          agentsUsed: parsedData.agentsCalledSequence
        })
        break

      default:
        console.log('❓ UNKNOWN OUTPUT TYPE:', parsedData.type)
        console.log('   Data:', JSON.stringify(parsedData, null, 2))
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

    // Generate new session ID for this conversation
    const newSessionId = generateLyzrSessionId()
    setSessionId(newSessionId)

    console.log('\n')
    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║                    SENDING MESSAGE TO LYZR                    ║')
    console.log('╠══════════════════════════════════════════════════════════════╣')
    console.log('║ Session ID:', newSessionId)
    console.log('║ Message:', content.trim().substring(0, 100) + (content.length > 100 ? '...' : ''))
    if (assetId) {
      console.log('║ Asset ID:', assetId)
    }
    console.log('╚══════════════════════════════════════════════════════════════╝')
    console.log('\n')

    // Set loading state
    setLoading(true)
    setAgentStatus({ currentAgent: null, isExecuting: true })

    try {
      // Send to LYZR API - response is handled via WebSocket
      // Pass asset IDs if provided
      const assets = assetId ? [assetId] : []
      await sendMessage(content.trim(), newSessionId, assets)

      console.log('✅ API call completed. Clearing loading state.')

      // API call resolved = manager agent is done
      // Clear loading state
      setLoading(false)
      clearAgentStatus()

    } catch (error) {
      console.error('❌ Failed to send message:', error)
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
      'analyze-spend': 'Analyze spend by category',
      'check-contracts': 'Check contract expirations',
      'add-vendor': 'I want to add a new vendor'
    }
    handleSendMessage(messages[action] || action)
  }

  // Handle action card click (opens detail panel)
  const handleActionClick = useCallback((actionType) => {
    console.log('📌 Action card clicked:', actionType)
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
    console.log('📁 File uploaded message added to chat')
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
            <MessageList messages={currentChat.messages} onActionClick={handleActionClick} />

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
