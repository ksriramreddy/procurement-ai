import { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { generateChatId } from '../utils/generateChatId'

const STORAGE_KEY = 'procurement-chats'

// Initial state
const initialState = {
  chats: {},
  currentChatId: null,
  isLoading: false,
  isDetailPanelOpen: false,
  detailPanelType: null, // 'vendors' | 'rfq' | 'vendor-details'
  agentStatus: {
    currentAgent: null,
    isExecuting: false,
    executedAgents: []
  },
  selectedVendor: null,
  pendingChatMessage: null
}

// Action types
const ACTIONS = {
  SET_CHATS: 'SET_CHATS',
  CREATE_CHAT: 'CREATE_CHAT',
  SET_CURRENT_CHAT: 'SET_CURRENT_CHAT',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  UPDATE_CHAT: 'UPDATE_CHAT',
  SET_LOADING: 'SET_LOADING',
  SET_AGENT_STATUS: 'SET_AGENT_STATUS',
  ADD_EXECUTED_AGENT: 'ADD_EXECUTED_AGENT',
  CLEAR_AGENT_STATUS: 'CLEAR_AGENT_STATUS',
  SET_VENDORS: 'SET_VENDORS',
  SET_RFQ_DATA: 'SET_RFQ_DATA',
  SET_RFP_DATA: 'SET_RFP_DATA',
  SET_CONTRACT_DATA: 'SET_CONTRACT_DATA',
  SET_PRICING_LOADING: 'SET_PRICING_LOADING',
  SHOW_DETAIL_PANEL: 'SHOW_DETAIL_PANEL',
  HIDE_DETAIL_PANEL: 'HIDE_DETAIL_PANEL',
  SET_SELECTED_VENDOR: 'SET_SELECTED_VENDOR',
  SET_RFQ_DOCUMENT: 'SET_RFQ_DOCUMENT',
  SET_RFP_DOCUMENT: 'SET_RFP_DOCUMENT',
  SET_PENDING_CHAT_MESSAGE: 'SET_PENDING_CHAT_MESSAGE',
  DELETE_CHAT: 'DELETE_CHAT',
  UPDATE_CHAT_TITLE: 'UPDATE_CHAT_TITLE'
}

// Reducer
function chatReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CHATS:
      return { ...state, chats: action.payload }

    case ACTIONS.CREATE_CHAT: {
      const newChat = {
        id: action.payload.id,
        title: 'New Procurement',
        messages: [],
        conversationType: null,
        vendors: [],
        externalVendors: [],
        rfqData: null,
        rfpData: null,
        contractData: null,
        rfqDocument: null,
        rfpDocument: null,
        isPricingLoading: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      return {
        ...state,
        chats: { ...state.chats, [action.payload.id]: newChat },
        currentChatId: action.payload.id,
        isDetailPanelOpen: false,
        detailPanelType: null,
        agentStatus: { currentAgent: null, isExecuting: false, executedAgents: [] }
      }
    }

    case ACTIONS.SET_CURRENT_CHAT:
      const chat = state.chats[action.payload]
      return {
        ...state,
        currentChatId: action.payload,
        isDetailPanelOpen: chat?.conversationType === 'DATABASE_QUERY' || chat?.conversationType === 'RFQ_REQUEST' || chat?.conversationType === 'RFP_REQUEST' || chat?.conversationType === 'CONTRACT_REQUEST',
        detailPanelType: chat?.conversationType === 'DATABASE_QUERY' ? 'vendors' :
                        chat?.conversationType === 'RFQ_REQUEST' ? 'rfq' :
                        chat?.conversationType === 'RFP_REQUEST' ? 'rfp' :
                        chat?.conversationType === 'CONTRACT_REQUEST' ? 'contract' : null
      }

    case ACTIONS.ADD_MESSAGE: {
      const { chatId, message } = action.payload
      const existingChat = state.chats[chatId]
      if (!existingChat) return state

      const updatedChat = {
        ...existingChat,
        messages: [...existingChat.messages, message],
        updatedAt: new Date().toISOString(),
        title: existingChat.messages.length === 0 && message.role === 'user'
          ? message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '')
          : existingChat.title
      }
      return {
        ...state,
        chats: { ...state.chats, [chatId]: updatedChat }
      }
    }

    case ACTIONS.UPDATE_MESSAGE: {
      const { chatId, messageId, updates } = action.payload
      const existingChat = state.chats[chatId]
      if (!existingChat) return state

      const updatedMessages = existingChat.messages.map(msg =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
      return {
        ...state,
        chats: {
          ...state.chats,
          [chatId]: { ...existingChat, messages: updatedMessages }
        }
      }
    }

    case ACTIONS.UPDATE_CHAT: {
      const { chatId, updates } = action.payload
      const existingChat = state.chats[chatId]
      if (!existingChat) return state

      return {
        ...state,
        chats: {
          ...state.chats,
          [chatId]: { ...existingChat, ...updates, updatedAt: new Date().toISOString() }
        }
      }
    }

    case ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload }

    case ACTIONS.SET_AGENT_STATUS:
      return {
        ...state,
        agentStatus: { ...state.agentStatus, ...action.payload }
      }

    case ACTIONS.ADD_EXECUTED_AGENT:
      return {
        ...state,
        agentStatus: {
          ...state.agentStatus,
          executedAgents: [...state.agentStatus.executedAgents, action.payload]
        }
      }

    case ACTIONS.CLEAR_AGENT_STATUS:
      return {
        ...state,
        agentStatus: { currentAgent: null, isExecuting: false, executedAgents: [] }
      }

    case ACTIONS.SET_VENDORS: {
      const { chatId, vendors, type } = action.payload
      const existingChat = state.chats[chatId]
      if (!existingChat) return state

      const updateKey = type === 'external' ? 'externalVendors' : 'vendors'
      return {
        ...state,
        chats: {
          ...state.chats,
          [chatId]: { ...existingChat, [updateKey]: vendors }
        }
      }
    }

    case ACTIONS.SET_RFQ_DATA: {
      const { chatId, rfqData } = action.payload
      const existingChat = state.chats[chatId]
      if (!existingChat) return state

      return {
        ...state,
        chats: {
          ...state.chats,
          [chatId]: { ...existingChat, rfqData }
        }
      }
    }

    case ACTIONS.SET_RFP_DATA: {
      const { chatId, rfpData } = action.payload
      const existingChat = state.chats[chatId]
      if (!existingChat) return state

      return {
        ...state,
        chats: {
          ...state.chats,
          [chatId]: { ...existingChat, rfpData }
        }
      }
    }

    case ACTIONS.SET_CONTRACT_DATA: {
      const { chatId, contractData } = action.payload
      const existingChat = state.chats[chatId]
      if (!existingChat) return state

      return {
        ...state,
        chats: {
          ...state.chats,
          [chatId]: { ...existingChat, contractData }
        }
      }
    }

    case ACTIONS.SET_PRICING_LOADING: {
      const { chatId, isPricingLoading } = action.payload
      const existingChat = state.chats[chatId]
      if (!existingChat) return state

      return {
        ...state,
        chats: {
          ...state.chats,
          [chatId]: { ...existingChat, isPricingLoading }
        }
      }
    }

    case ACTIONS.SHOW_DETAIL_PANEL:
      return {
        ...state,
        isDetailPanelOpen: true,
        detailPanelType: action.payload
      }

    case ACTIONS.HIDE_DETAIL_PANEL:
      return {
        ...state,
        isDetailPanelOpen: false,
        detailPanelType: null,
        selectedVendor: null
      }

    case ACTIONS.SET_RFQ_DOCUMENT: {
      const { chatId, rfqDocument } = action.payload
      const existingChat = state.chats[chatId]
      if (!existingChat) return state

      return {
        ...state,
        chats: {
          ...state.chats,
          [chatId]: { ...existingChat, rfqDocument }
        },
        isDetailPanelOpen: true,
        detailPanelType: 'rfq-preview'
      }
    }

    case ACTIONS.SET_RFP_DOCUMENT: {
      const { chatId, rfpDocument } = action.payload
      const existingChat = state.chats[chatId]
      if (!existingChat) return state

      return {
        ...state,
        chats: {
          ...state.chats,
          [chatId]: { ...existingChat, rfpDocument }
        },
        isDetailPanelOpen: true,
        detailPanelType: 'rfp-preview'
      }
    }

    case ACTIONS.SET_SELECTED_VENDOR:
      return {
        ...state,
        selectedVendor: action.payload,
        detailPanelType: action.payload ? 'vendor-details' : 'vendors'
      }

    case ACTIONS.SET_PENDING_CHAT_MESSAGE:
      return { ...state, pendingChatMessage: action.payload }

    case ACTIONS.DELETE_CHAT: {
      const { [action.payload]: deleted, ...remainingChats } = state.chats
      const chatIds = Object.keys(remainingChats)
      return {
        ...state,
        chats: remainingChats,
        currentChatId: state.currentChatId === action.payload
          ? (chatIds.length > 0 ? chatIds[0] : null)
          : state.currentChatId
      }
    }

    case ACTIONS.UPDATE_CHAT_TITLE: {
      const { chatId, title } = action.payload
      const existingChat = state.chats[chatId]
      if (!existingChat) return state

      return {
        ...state,
        chats: {
          ...state.chats,
          [chatId]: { ...existingChat, title }
        }
      }
    }

    default:
      return state
  }
}

// Context
const ChatContext = createContext(null)

// Provider
export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  // Load chats from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        dispatch({ type: ACTIONS.SET_CHATS, payload: parsed.chats || {} })
        if (parsed.currentChatId && parsed.chats[parsed.currentChatId]) {
          dispatch({ type: ACTIONS.SET_CURRENT_CHAT, payload: parsed.currentChatId })
        }
      }
    } catch (error) {
      console.error('Failed to load chats from storage:', error)
    }
  }, [])

  // Save chats to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        chats: state.chats,
        currentChatId: state.currentChatId
      }))
    } catch (error) {
      console.error('Failed to save chats to storage:', error)
    }
  }, [state.chats, state.currentChatId])

  // Actions
  const createChat = useCallback(() => {
    const id = generateChatId()
    dispatch({ type: ACTIONS.CREATE_CHAT, payload: { id } })
    return id
  }, [])

  const setCurrentChat = useCallback((chatId) => {
    dispatch({ type: ACTIONS.SET_CURRENT_CHAT, payload: chatId })
  }, [])

  const addMessage = useCallback((chatId, message) => {
    dispatch({ type: ACTIONS.ADD_MESSAGE, payload: { chatId, message } })
  }, [])

  const updateMessage = useCallback((chatId, messageId, updates) => {
    dispatch({ type: ACTIONS.UPDATE_MESSAGE, payload: { chatId, messageId, updates } })
  }, [])

  const updateChat = useCallback((chatId, updates) => {
    dispatch({ type: ACTIONS.UPDATE_CHAT, payload: { chatId, updates } })
  }, [])

  const setLoading = useCallback((loading) => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: loading })
  }, [])

  const setAgentStatus = useCallback((status) => {
    dispatch({ type: ACTIONS.SET_AGENT_STATUS, payload: status })
  }, [])

  const addExecutedAgent = useCallback((agentName) => {
    dispatch({ type: ACTIONS.ADD_EXECUTED_AGENT, payload: agentName })
  }, [])

  const clearAgentStatus = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_AGENT_STATUS })
  }, [])

  const setVendors = useCallback((chatId, vendors, type = 'internal') => {
    dispatch({ type: ACTIONS.SET_VENDORS, payload: { chatId, vendors, type } })
  }, [])

  const setRfqData = useCallback((chatId, rfqData) => {
    dispatch({ type: ACTIONS.SET_RFQ_DATA, payload: { chatId, rfqData } })
  }, [])

  const setRfpData = useCallback((chatId, rfpData) => {
    dispatch({ type: ACTIONS.SET_RFP_DATA, payload: { chatId, rfpData } })
  }, [])

  const setContractData = useCallback((chatId, contractData) => {
    dispatch({ type: ACTIONS.SET_CONTRACT_DATA, payload: { chatId, contractData } })
  }, [])

  const setPricingLoading = useCallback((chatId, isPricingLoading) => {
    dispatch({ type: ACTIONS.SET_PRICING_LOADING, payload: { chatId, isPricingLoading } })
  }, [])

  const showDetailPanel = useCallback((type) => {
    dispatch({ type: ACTIONS.SHOW_DETAIL_PANEL, payload: type })
  }, [])

  const hideDetailPanel = useCallback(() => {
    dispatch({ type: ACTIONS.HIDE_DETAIL_PANEL })
  }, [])

  const setSelectedVendor = useCallback((vendor) => {
    dispatch({ type: ACTIONS.SET_SELECTED_VENDOR, payload: vendor })
  }, [])

  const setRfqDocument = useCallback((chatId, rfqDocument) => {
    dispatch({ type: ACTIONS.SET_RFQ_DOCUMENT, payload: { chatId, rfqDocument } })
  }, [])

  const setRfpDocument = useCallback((chatId, rfpDocument) => {
    dispatch({ type: ACTIONS.SET_RFP_DOCUMENT, payload: { chatId, rfpDocument } })
  }, [])

  const setPendingChatMessage = useCallback((message) => {
    dispatch({ type: ACTIONS.SET_PENDING_CHAT_MESSAGE, payload: message })
  }, [])

  const deleteChat = useCallback((chatId) => {
    dispatch({ type: ACTIONS.DELETE_CHAT, payload: chatId })
  }, [])

  const updateChatTitle = useCallback((chatId, title) => {
    dispatch({ type: ACTIONS.UPDATE_CHAT_TITLE, payload: { chatId, title } })
  }, [])

  const value = {
    ...state,
    currentChat: state.currentChatId ? state.chats[state.currentChatId] : null,
    chatList: Object.values(state.chats).sort((a, b) =>
      new Date(b.updatedAt) - new Date(a.updatedAt)
    ),
    createChat,
    setCurrentChat,
    addMessage,
    updateMessage,
    updateChat,
    setLoading,
    setAgentStatus,
    addExecutedAgent,
    clearAgentStatus,
    setVendors,
    setRfqData,
    setRfpData,
    setContractData,
    setPricingLoading,
    showDetailPanel,
    hideDetailPanel,
    setSelectedVendor,
    setRfqDocument,
    setRfpDocument,
    setPendingChatMessage,
    deleteChat,
    updateChatTitle
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}

// Hook
export function useChatStore() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatStore must be used within a ChatProvider')
  }
  return context
}
