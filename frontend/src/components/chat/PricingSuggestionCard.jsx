import { useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react'
import Card from '../ui/Card'

export default function PricingSuggestionCard({
  price = 0,
  currency = 'USD',
  onApprove,
  onReject
}) {
  const [response, setResponse] = useState(null)

  const handleApprove = () => {
    setResponse('approved')
    onApprove?.()
  }

  const handleReject = () => {
    setResponse('rejected')
    onReject?.()
  }

  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(value)
  }

  if (response === 'approved') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-accent-success/15 border border-accent-success/40">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent-success/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-accent-success" />
                </div>
                <div>
                  <p className="text-xs text-accent-success uppercase tracking-wide font-medium">
                    Suggested Price Approved
                  </p>
                  <p className="text-2xl font-playfair font-bold text-accent-success">
                    {formatPrice(price)}
                  </p>
                </div>
              </div>
              <CheckCircle className="w-6 h-6 text-accent-success flex-shrink-0" />
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  if (response === 'rejected') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-accent-error/15 border border-accent-error/40">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent-error/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-accent-error" />
                </div>
                <div>
                  <p className="text-xs text-accent-error uppercase tracking-wide font-medium">
                    Price Not Accepted
                  </p>
                  <p className="text-2xl font-playfair font-bold text-accent-error">
                    {formatPrice(price)}
                  </p>
                </div>
              </div>
              <CheckCircle className="w-6 h-6 text-accent-error flex-shrink-0" />
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gradient-to-r from-accent-cool/5 to-lyzr-ferra/5 border border-accent-cool/30">
        <div className="p-4">
          {/* Price Section */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-lyzr-mid-4 uppercase tracking-wide mb-1">
                💰 Suggested Procurement Price
              </p>
              <p className="text-2xl font-playfair font-bold text-lyzr-congo">
                {formatPrice(price)}
              </p>
            </div>
            <div className="w-10 h-10 bg-accent-cool/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-accent-cool" />
            </div>
          </div>

          <p className="text-xs text-lyzr-mid-4 mb-4">
            Based on AI analysis of your procurement requirements and market data.
          </p>

          {/* Actions */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleApprove}
              className="flex-1 flex items-center justify-center gap-2 bg-accent-success/10 hover:bg-accent-success/20
                text-accent-success px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              <ThumbsUp className="w-4 h-4" />
              Approve
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReject}
              className="flex-1 flex items-center justify-center gap-2 bg-accent-error/10 hover:bg-accent-error/20
                text-accent-error px-3 py-2 rounded-lg transition-colors duration-200 text-sm font-medium"
            >
              <ThumbsDown className="w-4 h-4" />
              Reject
            </motion.button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
