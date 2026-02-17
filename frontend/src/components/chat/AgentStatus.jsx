import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

// Friendly agent display names (no "Manager Agent")
const AGENT_DISPLAY = {
  'Chat Decision Maker': 'Analyzing request',
  'Internal Vendor Fetcher': 'Searching internal database',
  'External Vendor Fetcher': 'Searching external sources',
  'RFQ Generator': 'Preparing RFQ form',
  'General Chat': 'Generating response',
  'Manager Agent': 'Coordinating agents',
  'Processing Agent': 'Processing request',
  'AI Agent': 'Processing request'
}

function getDisplayName(agentName) {
  if (!agentName) return null
  return AGENT_DISPLAY[agentName] || agentName
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-[3px] ml-1">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1 h-1 bg-lyzr-ferra rounded-full inline-block"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </span>
  )
}

export default function AgentStatus({
  currentAgent,
  executedAgents = [],
  isExecuting = false
}) {
  const [visibleCompleted, setVisibleCompleted] = useState([])

  // Track completed agents and auto-remove them after a delay
  useEffect(() => {
    setVisibleCompleted(executedAgents)
  }, [executedAgents])

  // Remove completed agents one by one after 3 seconds
  useEffect(() => {
    if (visibleCompleted.length > 0 && !isExecuting) {
      const timer = setTimeout(() => {
        setVisibleCompleted([])
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [visibleCompleted, isExecuting])

  const displayName = getDisplayName(currentAgent)

  return (
    <div className="flex items-start gap-3">
      {/* Avatar */}
      <img src="/image.png" alt="Lyzr" className="w-8 h-8 rounded-full object-contain flex-shrink-0" />

      {/* Status Content */}
      <div className="flex-1 bg-white rounded-2xl rounded-tl-md border border-lyzr-cream p-4 max-w-sm">
        {/* Completed agent steps */}
        <AnimatePresence>
          {visibleCompleted.map((agent, index) => (
            <motion.div
              key={`completed-${index}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 mb-2"
            >
              <div className="w-4 h-4 bg-accent-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-2.5 h-2.5 text-accent-success" />
              </div>
              <span className="text-xs text-lyzr-mid-4">
                {getDisplayName(agent.name) || agent.name}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Current agent / typing animation */}
        {isExecuting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            {/* Pulse dot */}
            <div className="relative flex-shrink-0">
              <div className="w-2 h-2 bg-lyzr-ferra rounded-full" />
              <div className="absolute inset-0 w-2 h-2 bg-lyzr-ferra rounded-full animate-ping opacity-50" />
            </div>

            <span className="text-sm text-lyzr-congo">
              {displayName ? (
                <>
                  {displayName}
                  <TypingDots />
                </>
              ) : (
                <>
                  Agent is processing
                  <TypingDots />
                </>
              )}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  )
}