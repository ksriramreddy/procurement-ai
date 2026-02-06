import { motion } from 'framer-motion'
import { Search, TrendingUp, FileCheck, UserPlus } from 'lucide-react'

const QUICK_ACTIONS = [
  {
    id: 'show-vendors',
    label: 'Show me all active vendors',
    icon: Search,
    color: 'bg-lyzr-ferra'
  },
  {
    id: 'analyze-spend',
    label: 'Analyze spend by category',
    icon: TrendingUp,
    color: 'bg-accent-warm'
  },
  {
    id: 'check-contracts',
    label: 'Check contract expirations',
    icon: FileCheck,
    color: 'bg-accent-success'
  },
  {
    id: 'add-vendor',
    label: 'Add new vendor',
    icon: UserPlus,
    color: 'bg-accent-cool'
  }
]

export default function WelcomeScreen({ onQuickAction }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-16 h-16 bg-lyzr-black rounded-2xl flex items-center justify-center mb-8"
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M12 4L4 8v8l8 4 8-4V8l-8-4z" stroke="#F3EFEA" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M12 12l8-4M12 12v8M12 12L4 8" stroke="#F3EFEA" strokeWidth="2" strokeLinejoin="round"/>
        </svg>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="font-playfair text-3xl font-semibold text-lyzr-congo mb-3 text-center"
      >
        What can I help you with?
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-lyzr-mid-4 mb-4 text-center italic"
      >
        Vendor Management • Contract Intelligence • RFP Solutions
      </motion.p>

      {/* Powered by */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="flex items-center gap-2 mb-12"
      >
        <span className="text-sm text-lyzr-mid-4">Powered by</span>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 bg-lyzr-black rounded flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M12 4L4 8v8l8 4 8-4V8l-8-4z" stroke="#F3EFEA" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-medium text-lyzr-congo">lyzr</span>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full"
      >
        {QUICK_ACTIONS.map((action, index) => {
          const Icon = action.icon

          return (
            <motion.button
              key={action.id}
              onClick={() => onQuickAction(action.id)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-lyzr-cream
                hover:border-lyzr-mid-1 hover:shadow-md transition-all duration-200 text-left"
            >
              <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-medium text-lyzr-congo">{action.label}</span>
            </motion.button>
          )
        })}
      </motion.div>
    </div>
  )
}
