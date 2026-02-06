import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/layout/Sidebar'
import ChatArea from './components/layout/ChatArea'
import DetailPanel from './components/layout/DetailPanel'
import Dashboard from './components/dashboard/Dashboard'
import { useChatStore } from './store/chatStore'

function App() {
  const { currentChat, isDetailPanelOpen } = useChatStore()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState('chat')

  return (
    <div className="flex h-screen bg-lyzr-white-amber overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activeNav={activeNav}
        onNavChange={setActiveNav}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {activeNav === 'dashboard' ? <Dashboard /> : <ChatArea />}
      </main>

      {/* Right Detail Panel - Only show in chat view */}
      <AnimatePresence>
        {activeNav === 'chat' && isDetailPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 420, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="border-l border-lyzr-cream bg-white overflow-hidden"
          >
            <DetailPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
