import { motion } from 'framer-motion'
import { FileText, Database, ChevronRight, CheckCircle2, Send, Sparkles, ClipboardList, Scale } from 'lucide-react'

/**
 * Clickable action card that appears in chat when RFQ or Database query is triggered
 */
export default function ActionCard({ actionType, onClick, isComplete = false }) {
  const configs = {
    rfq: {
      icon: FileText,
      title: 'RFQ Creation Requested',
      subtitle: 'Click to view and fill the RFQ form',
      completeTitle: 'RFQ Form Ready',
      completeSubtitle: 'Click to view the RFQ form',
      bgColor: 'bg-accent-warm/10',
      borderColor: 'border-accent-warm/30',
      iconBg: 'bg-accent-warm/20',
      iconColor: 'text-accent-warm'
    },
    rfp: {
      icon: ClipboardList,
      title: 'RFP Creation Requested',
      subtitle: 'Click to view and fill the RFP form',
      completeTitle: 'RFP Form Ready',
      completeSubtitle: 'Click to view the RFP form',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-600'
    },
    contract: {
      icon: Scale,
      title: 'Contract Creation Requested',
      subtitle: 'Click to view and fill the contract form',
      completeTitle: 'Contract Form Ready',
      completeSubtitle: 'Click to view the contract form',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-600'
    },
    vendors: {
      icon: Database,
      title: 'Vendor Search Initiated',
      subtitle: 'Click to view vendor results',
      completeTitle: 'Vendor Results Ready',
      completeSubtitle: 'Click to view matching vendors',
      bgColor: 'bg-accent-cool/10',
      borderColor: 'border-accent-cool/30',
      iconBg: 'bg-accent-cool/20',
      iconColor: 'text-accent-cool'
    },
    'rfq-preview': {
      icon: Sparkles,
      title: 'RFQ Document Generated',
      subtitle: 'Click to review the generated RFQ document',
      completeTitle: 'RFQ Document Ready',
      completeSubtitle: 'Click to review and send',
      bgColor: 'bg-lyzr-ferra/10',
      borderColor: 'border-lyzr-ferra/30',
      iconBg: 'bg-lyzr-ferra/20',
      iconColor: 'text-lyzr-ferra'
    },
    'rfq-sent': {
      icon: Send,
      title: 'RFQ Submitted',
      subtitle: 'Your RFQ has been sent to vendors',
      completeTitle: 'RFQ Submitted',
      completeSubtitle: 'Your RFQ has been sent to vendors',
      bgColor: 'bg-accent-success/10',
      borderColor: 'border-accent-success/30',
      iconBg: 'bg-accent-success/20',
      iconColor: 'text-accent-success'
    },
    'rfp-preview': {
      icon: Sparkles,
      title: 'RFP Document Generated',
      subtitle: 'Click to review the generated RFP document',
      completeTitle: 'RFP Document Ready',
      completeSubtitle: 'Click to review and send',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-600'
    },
    'rfp-sent': {
      icon: Send,
      title: 'RFP Submitted',
      subtitle: 'Your RFP has been sent to vendors',
      completeTitle: 'RFP Submitted',
      completeSubtitle: 'Your RFP has been sent to vendors',
      bgColor: 'bg-accent-success/10',
      borderColor: 'border-accent-success/30',
      iconBg: 'bg-accent-success/20',
      iconColor: 'text-accent-success'
    },
    'contract-preview': {
      icon: Sparkles,
      title: 'Contract Document Generated',
      subtitle: 'Click to review the generated contract document',
      completeTitle: 'Contract Document Ready',
      completeSubtitle: 'Click to review and send',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-600'
    },
    'contract-sent': {
      icon: Send,
      title: 'Contract Submitted',
      subtitle: 'Your contract has been sent to vendors',
      completeTitle: 'Contract Submitted',
      completeSubtitle: 'Your contract has been sent to vendors',
      bgColor: 'bg-accent-success/10',
      borderColor: 'border-accent-success/30',
      iconBg: 'bg-accent-success/20',
      iconColor: 'text-accent-success'
    }
  }

  const config = configs[actionType]
  if (!config) return null

  const Icon = config.icon
  const isClickable = actionType !== 'rfq-sent' && actionType !== 'rfp-sent' && actionType !== 'contract-sent'

  return (
    <motion.button
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={isClickable ? { scale: 1.02 } : {}}
      whileTap={isClickable ? { scale: 0.98 } : {}}
      onClick={isClickable ? onClick : undefined}
      className={`
        w-full mt-3 p-4 rounded-xl border
        ${config.bgColor} ${config.borderColor}
        flex items-center gap-4 text-left
        transition-all duration-200
        ${isClickable ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}
        group
      `}
    >
      {/* Icon */}
      <div className={`
        w-12 h-12 rounded-xl flex items-center justify-center
        ${config.iconBg}
        ${isClickable ? 'transition-transform group-hover:scale-110' : ''}
      `}>
        {isComplete ? (
          <CheckCircle2 className={`w-6 h-6 ${config.iconColor}`} />
        ) : (
          <Icon className={`w-6 h-6 ${config.iconColor}`} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-lyzr-congo text-sm">
          {isComplete ? config.completeTitle : config.title}
        </h4>
        <p className="text-xs text-lyzr-mid-4 mt-0.5">
          {isComplete ? config.completeSubtitle : config.subtitle}
        </p>
      </div>

      {/* Arrow - only for clickable cards */}
      {isClickable && (
        <ChevronRight className={`
          w-5 h-5 text-lyzr-mid-4
          transition-transform group-hover:translate-x-1
        `} />
      )}
    </motion.button>
  )
}
