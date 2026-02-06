import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, CheckCircle, Edit3, FileText, X } from 'lucide-react'
import Button from '../ui/Button'
import { useChatStore } from '../../store/chatStore'
import { callPricingSuggestionAgent } from '../../services/api'

export default function RFQPreview({ rfqDocument }) {
  const { currentChat, currentChatId, addMessage, showDetailPanel } = useChatStore()
  const [content, setContent] = useState(rfqDocument || '')
  const [isEditing, setIsEditing] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const handleSend = async () => {
    setIsSending(true)

    // Show success popup
    setShowSuccess(true)

    // Add a card in the chat
    addMessage(currentChatId, {
      id: `rfq-sent-${Date.now()}`,
      role: 'assistant',
      content: 'Your RFQ request has been submitted successfully.',
      timestamp: new Date().toISOString(),
      actionType: 'rfq-sent',
      actionComplete: true
    })

    // Call pricing suggestion agent
    try {
      const rfqData = currentChat?.rfqData
      const pricingResponse = await callPricingSuggestionAgent(rfqData)
      
      // Add pricing suggestion message
      addMessage(currentChatId, {
        id: `pricing-suggestion-${Date.now()}`,
        role: 'assistant',
        content: `Based on your procurement requirements, here's the AI-suggested pricing:`,
        timestamp: new Date().toISOString(),
        actionType: 'pricing-suggestion',
        pricingData: {
          price: pricingResponse?.price,
          currency: pricingResponse?.currency || 'USD'
        },
        actionComplete: false
      })
    } catch (error) {
      console.error('Failed to get pricing suggestion:', error)
      // Don't fail the send if pricing fails
    } finally {
      setIsSending(false)
    }

    // Auto-hide success after 3 seconds
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Success Popup Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/30 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full text-center relative"
            >
              <button
                onClick={() => setShowSuccess(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-lyzr-light-2 transition-colors"
              >
                <X className="w-5 h-5 text-lyzr-mid-4" />
              </button>
              <div className="w-16 h-16 bg-accent-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-accent-success" />
              </div>
              <h3 className="font-playfair text-lg font-semibold text-lyzr-congo mb-2">
                RFQ Request Submitted
              </h3>
              <p className="text-sm text-lyzr-mid-4">
                Your RFQ has been sent to the selected vendors. You will be notified when responses are received.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RFQ Document Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Edit Toggle */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-lyzr-mid-4" />
            <span className="text-sm font-medium text-lyzr-congo">Generated RFQ Document</span>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isEditing
                ? 'bg-lyzr-ferra text-white'
                : 'bg-lyzr-light-2 text-lyzr-congo hover:bg-lyzr-cream'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            {isEditing ? 'Editing' : 'Edit'}
          </button>
        </div>

        {/* Content Area */}
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-[calc(100%-4rem)] min-h-[400px] px-4 py-3 bg-white border border-lyzr-cream
              rounded-xl text-sm text-lyzr-black leading-relaxed font-mono resize-none
              focus:outline-none focus:ring-2 focus:ring-lyzr-ferra/30 focus:border-lyzr-ferra"
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border border-lyzr-cream rounded-xl p-4 text-sm text-lyzr-black leading-relaxed whitespace-pre-wrap"
          >
            {content}
          </motion.div>
        )}
      </div>

      {/* Send Button */}
      <div className="p-4 border-t border-lyzr-cream bg-white/80 backdrop-blur-sm">
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSend}
          disabled={showSuccess || isSending}
        >
          <Send className="w-4 h-4" />
          {isSending ? 'Sending...' : 'Send RFQ'}
        </Button>
      </div>
    </div>
  )
}