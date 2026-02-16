import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from './components/layout/Sidebar'
import ChatArea from './components/layout/ChatArea'
import DetailPanel from './components/layout/DetailPanel'
import Dashboard from './components/dashboard/Dashboard'
import VendorPortal from './components/vendors/VendorPortal'
import { useChatStore } from './store/chatStore'

const MIN_PANEL_WIDTH = 320
const MAX_PANEL_WIDTH = 800
const DEFAULT_PANEL_WIDTH = 420

function App() {
  const { currentChat, isDetailPanelOpen } = useChatStore()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [activeNav, setActiveNav] = useState('chat')
  const [viewMode, setViewMode] = useState('customer')
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(DEFAULT_PANEL_WIDTH)

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = panelWidth
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [panelWidth])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return
      // Dragging left increases panel width (panel is on the right)
      const delta = startX.current - e.clientX
      const newWidth = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, startWidth.current + delta))
      setPanelWidth(newWidth)
    }

    const handleMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  return (
    <div className="flex h-screen bg-lyzr-white-amber overflow-hidden">
      {/* Left Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {activeNav === 'dashboard' ? (
          <Dashboard />
        ) : activeNav === 'vendors' ? (
          <VendorPortal />
        ) : (
          <ChatArea />
        )}
      </main>

      {/* Right Detail Panel - Only show in chat view */}
      <AnimatePresence>
        {activeNav === 'chat' && isDetailPanelOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: panelWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: isDragging.current ? 0 : 0.3, ease: 'easeInOut' }}
            className="relative border-l border-lyzr-cream bg-white overflow-hidden flex-shrink-0"
            style={{ width: panelWidth }}
          >
            {/* Drag handle */}
            <div
              onMouseDown={handleMouseDown}
              className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10
                hover:bg-lyzr-ferra/20 active:bg-lyzr-ferra/30 transition-colors"
            />
            <DetailPanel />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
