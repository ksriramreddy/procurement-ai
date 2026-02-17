import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Plus,
  Search,
  LayoutDashboard,
  Building2,
  FileText,
  ChevronLeft,
  ChevronRight,
  Trash2,
  MoreVertical,
  User
} from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import Button from '../ui/Button'

const NAV_ITEMS = [
  { id: 'chat', label: 'Chat', icon: MessageSquare, active: true },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'internal-vendors', label: 'Internal Vendors', icon: Building2 },
  { id: 'contracts', label: 'Contracts', icon: FileText }
]

export default function Sidebar({ isCollapsed, onToggle, activeNav, onNavChange, viewMode = 'customer', onViewModeChange }) {
  const {
    chatList,
    currentChatId,
    createChat,
    setCurrentChat,
    deleteChat
  } = useChatStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredChat, setHoveredChat] = useState(null)

  const handleNavClick = (navId) => {
    onNavChange?.(navId)
  }

  const handleViewModeChange = (mode) => {
    onViewModeChange?.(mode)
    onNavChange?.('chat')
  }

  const filteredNavItems = NAV_ITEMS

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chatList
    return chatList.filter(chat =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [chatList, searchQuery])

  const handleNewChat = () => {
    createChat()
  }

  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation()
    deleteChat(chatId)
  }

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 72 : 280 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="relative h-full bg-white border-r border-lyzr-cream flex flex-col"
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-lyzr-black rounded-xl flex items-center justify-center flex-shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 4L4 8v8l8 4 8-4V8l-8-4z" stroke="#F3EFEA" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M12 12l8-4M12 12v8M12 12L4 8" stroke="#F3EFEA" strokeWidth="2" strokeLinejoin="round"/>
          </svg>
        </div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              <span className="font-playfair text-lg font-semibold text-lyzr-congo">lyzr</span>
              <span className="text-xs text-lyzr-mid-4">Procurement Hub</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* View Mode Toggle */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-3 pb-2"
          >
            <div className="flex gap-1 bg-lyzr-light-2 rounded-lg p-1">
              <button
                onClick={() => handleViewModeChange('customer')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium
                  transition-all duration-200
                  ${viewMode === 'customer'
                    ? 'bg-white text-lyzr-congo shadow-sm'
                    : 'text-lyzr-mid-4 hover:text-lyzr-congo'
                  }`}
              >
                <User className="w-3.5 h-3.5" />
                Customer
              </button>
              <button
                onClick={() => handleViewModeChange('vendor')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium
                  transition-all duration-200
                  ${viewMode === 'vendor'
                    ? 'bg-white text-lyzr-congo shadow-sm'
                    : 'text-lyzr-mid-4 hover:text-lyzr-congo'
                  }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Vendor
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="px-3 py-2">
        {filteredNavItems.map(item => {
          const Icon = item.icon
          const isActive = activeNav === item.id

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1
                transition-all duration-200
                ${isActive
                  ? 'bg-lyzr-ferra text-white'
                  : 'text-lyzr-congo hover:bg-lyzr-cream'
                }
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && !isCollapsed && (
                <div className="w-1.5 h-1.5 rounded-full bg-white ml-auto" />
              )}
            </button>
          )
        })}
      </nav>

      {/* Chat History Section */}
      <AnimatePresence>
        {activeNav === 'chat' && !isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* New Chat Button */}
            <div className="px-3 py-2">
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={handleNewChat}
              >
                <Plus className="w-4 h-4" />
                <span>New Procurement</span>
              </Button>
            </div>

            {/* Chat History Header */}
            <div className="px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-medium text-lyzr-mid-4 uppercase tracking-wider">
                Chat History
              </span>
            </div>

            {/* Search */}
            <div className="px-3 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lyzr-mid-4" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-lyzr-light-1 border border-transparent rounded-lg text-sm
                    placeholder-lyzr-mid-4 focus:outline-none focus:border-lyzr-cream"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto px-3 pb-3">
              {filteredChats.length === 0 ? (
                <div className="text-center py-8 text-lyzr-mid-4 text-sm">
                  {searchQuery ? 'No chats found' : 'No chat history yet'}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredChats.map(chat => (
                    <motion.button
                      key={chat.id}
                      onClick={() => setCurrentChat(chat.id)}
                      onMouseEnter={() => setHoveredChat(chat.id)}
                      onMouseLeave={() => setHoveredChat(null)}
                      whileHover={{ x: 2 }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                        transition-colors duration-200 group
                        ${currentChatId === chat.id
                          ? 'bg-lyzr-cream text-lyzr-congo'
                          : 'text-lyzr-dark-2 hover:bg-lyzr-light-2'
                        }
                      `}
                    >
                      <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-50" />
                      <span className="flex-1 text-sm truncate">{chat.title}</span>
                      {hoveredChat === chat.id && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          onClick={(e) => handleDeleteChat(e, chat.id)}
                          className="p-1 hover:bg-lyzr-mid-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-lyzr-mid-4 hover:text-accent-error" />
                        </motion.button>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-lyzr-cream
          rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10"
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 text-lyzr-congo" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-lyzr-congo" />
        )}
      </button>

      {/* Footer */}
      <div className="p-4 border-t border-lyzr-cream">
        <div className="flex items-center gap-2 justify-center">
          <span className={`text-xs text-lyzr-mid-4 ${isCollapsed ? 'hidden' : ''}`}>
            Powered by
          </span>
          <div className="w-5 h-5 bg-lyzr-black rounded flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 4L4 8v8l8 4 8-4V8l-8-4z" stroke="#F3EFEA" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className={`text-xs font-medium text-lyzr-congo ${isCollapsed ? 'hidden' : ''}`}>
            lyzr
          </span>
        </div>
      </div>
    </motion.aside>
  )
}
