import { motion } from 'framer-motion'
import { User, Bot, AlertCircle } from 'lucide-react'
import Badge from '../ui/Badge'
import ActionCard from './ActionCard'
import PricingSuggestionCard from './PricingSuggestionCard'
import { useChatStore } from '../../store/chatStore'

export default function MessageBubble({ message, onActionClick }) {
  const isUser = message.role === 'user'
  const isError = message.error
  const { currentChatId, currentChat, updateMessage, setRfqData, showDetailPanel } = useChatStore()

  // Handle action card click
  const handleActionClick = () => {
    if (message.actionType && onActionClick) {
      onActionClick(message.actionType)
    }
  }

  // Handle pricing approval - Set price as RFQ budget and open RFQ form
  const handlePricingApprove = () => {
    // Update the message to show it's been approved
    updateMessage(currentChatId, message.id, {
      actionComplete: true,
      pricingApproved: true
    })

    // Get the suggested price and set it as RFQ budget
    const suggestedPrice = message.pricingData?.price
    if (suggestedPrice && currentChat?.rfqData) {
      // Update RFQ data with the suggested price as budget
      const updatedRfqData = {
        ...currentChat.rfqData,
        budget_range: `$${suggestedPrice.toLocaleString()}`
      }
      setRfqData(currentChatId, updatedRfqData)
    } else if (suggestedPrice) {
      // If no existing RFQ data, create new one with the price
      const newRfqData = {
        rfqId: '',
        organizationName: currentChat?.organizationName || '',
        contactPerson: { name: '', email: '' },
        procurementType: '',
        requirementSummary: '',
        quantity: '',
        deliveryTimeline: '',
        budget_range: `$${suggestedPrice.toLocaleString()}`,
        responseDeadline: ''
      }
      setRfqData(currentChatId, newRfqData)
    }

    // Open RFQ form for user to fill
    showDetailPanel('rfq')
  }

  // Handle pricing rejection
  const handlePricingReject = () => {
    // Update the message to show it's been rejected
    updateMessage(currentChatId, message.id, {
      actionComplete: true,
      pricingApproved: false
    })
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${isUser ? 'bg-lyzr-ferra' : 'bg-lyzr-black'}
        `}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 4L4 8v8l8 4 8-4V8l-8-4z" stroke="#F3EFEA" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Sender Label */}
          {!isUser && (
            <span className="text-xs text-lyzr-mid-4 mb-1 ml-1">Lyzr AI</span>
          )}

          {/* Bubble */}
          <div
            className={`
              px-4 py-3 rounded-2xl
              ${isUser
                ? 'bg-lyzr-ferra text-white rounded-tr-md'
                : isError
                  ? 'bg-accent-error/10 border border-accent-error/20 text-lyzr-congo rounded-tl-md'
                  : 'bg-white border border-lyzr-cream text-lyzr-congo rounded-tl-md'
              }
            `}
          >
            {isError && (
              <div className="flex items-center gap-2 mb-2 text-accent-error">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Error</span>
              </div>
            )}

            {/* Message Text */}
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>

            {/* Pricing Suggestion Card */}
            {message.actionType === 'pricing-suggestion' && message.pricingData && !isUser && (
              <div className="mt-4">
                <PricingSuggestionCard
                  price={message.pricingData.price}
                  currency={message.pricingData.currency}
                  onApprove={handlePricingApprove}
                  onReject={handlePricingReject}
                />
              </div>
            )}

            {/* Action Card - for RFQ or Vendor Search triggers */}
            {message.actionType && message.actionType !== 'pricing-suggestion' && !isUser && (
              <ActionCard
                actionType={message.actionType}
                onClick={handleActionClick}
                isComplete={message.actionComplete}
              />
            )}

            {/* Agents Used */}
            {message.agentsUsed && message.agentsUsed.length > 0 && (
              <div className="mt-3 pt-3 border-t border-lyzr-cream/50">
                <span className="text-xs text-lyzr-mid-4 block mb-2">Agents used:</span>
                <div className="flex flex-wrap gap-1.5">
                  {message.agentsUsed.map((agent, i) => (
                    <Badge key={i} variant="secondary" size="sm">
                      {agent.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-[10px] text-lyzr-mid-4 mt-1 mx-1">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
