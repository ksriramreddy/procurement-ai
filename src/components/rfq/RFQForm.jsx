import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  User,
  Mail,
  Package,
  FileText,
  Hash,
  Calendar,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Zap,
  X
} from 'lucide-react'
import Input, { Textarea } from '../ui/Input'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import { generateRfqDocument, callPricingSuggestionAgent } from '../../services/api'
import { useChatStore } from '../../store/chatStore'

const SECTIONS = [
  {
    id: 'general',
    title: 'General Supplier Information',
    icon: Building2,
    fields: ['organization_name', 'contact_name', 'contact_email']
  },
  {
    id: 'procurement',
    title: 'Procurement Details',
    icon: Package,
    fields: ['procurement_type', 'requirement_summary', 'quantity']
  },
  {
    id: 'timeline',
    title: 'Timeline & Budget',
    icon: Calendar,
    fields: ['delivery_timeline', 'budget_range', 'response_deadline']
  }
]

export default function RFQForm({ rfqData }) {
  const { currentChatId, setRfqDocument, addMessage, setRfqData, setPricingLoading } = useChatStore()

  const [formData, setFormData] = useState({
    rfq_id: '',
    organization_name: '',
    contact_name: '',
    contact_email: '',
    procurement_type: '',
    requirement_summary: '',
    quantity: '',
    delivery_timeline: '',
    budget_range: '',
    response_deadline: ''
  })

  const [expandedSections, setExpandedSections] = useState(['general'])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(null)
  
  // Pricing suggestion states
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [showFeedbackTooltip, setShowFeedbackTooltip] = useState(false)
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false)
  const [priceError, setPriceError] = useState(null)
  const [pricingValidationError, setPricingValidationError] = useState(null)

  // Update form when rfqData changes
  useEffect(() => {
    if (rfqData) {
      setFormData({
        rfq_id: rfqData.rfqId || '',
        organization_name: rfqData.organizationName || '',
        contact_name: rfqData.contactPerson?.name || '',
        contact_email: rfqData.contactPerson?.email || '',
        procurement_type: rfqData.procurementType || '',
        requirement_summary: rfqData.requirementSummary || '',
        quantity: rfqData.quantity || '',
        delivery_timeline: rfqData.deliveryTimeline || '',
        budget_range: rfqData.budgetRange || '',
        response_deadline: rfqData.responseDeadline
          ? new Date(rfqData.responseDeadline).toISOString().split('T')[0]
          : ''
      })

      // Expand all sections if data is populated
      if (rfqData.organizationName) {
        setExpandedSections(['general', 'procurement', 'timeline'])
      }
    }
  }, [rfqData])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAIPriceRecommendation = async () => {
    setPricingValidationError(null)
    setPriceError(null)
    
    // Validate requirement summary
    if (!formData.requirement_summary?.trim()) {
      setPricingValidationError('Requirement summary is required to get AI price recommendation')
      return
    }

    setIsLoadingPrice(true)
    setPricingLoading(currentChatId, true)
    try {
      const response = await callPricingSuggestionAgent({
        requirementSummary: formData.requirement_summary,
        budgetRange: formData.budget_range,
        procurementType: formData.procurement_type,
        item: formData.procurement_type
      })

      if (response?.price) {
        // Update RFQ data with manual pricing
        setRfqData(currentChatId, {
          ...rfqData,
          suggestedPrice: response.price,
          suggestedCurrency: response.currency || 'USD'
        })
      } else {
        setPriceError('No price suggestion received')
      }
    } catch (error) {
      console.error('Failed to get price recommendation:', error)
      setPriceError('Failed to get AI price recommendation. Try again.')
    } finally {
      setIsLoadingPrice(false)
      setPricingLoading(currentChatId, false)
    }
  }

  const handleAcceptSuggestedPrice = () => {
    if (rfqData?.suggestedPrice) {
      setFormData(prev => ({
        ...prev,
        budget_range: `$${rfqData.suggestedPrice.toLocaleString()}`
      }))
    }
  }

  const handleRejectSuggestedPrice = () => {
    setShowFeedbackTooltip(true)
    setFeedbackText('')
  }

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      return
    }

    setIsSubmittingFeedback(true)
    try {
      console.log('Feedback submitted:', feedbackText)
      // Show success animation for 600ms then close
      await new Promise(resolve => setTimeout(resolve, 600))
      setShowFeedbackTooltip(false)
      setFeedbackText('')
      // Clear suggested price after feedback
      setRfqData(currentChatId, {
        ...rfqData,
        suggestedPrice: null
      })
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    } finally {
      setIsSubmittingFeedback(false)
    }
  }

  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const getSectionCompletion = (section) => {
    const filledFields = section.fields.filter(field => formData[field]?.trim())
    return {
      filled: filledFields.length,
      total: section.fields.length,
      percentage: Math.round((filledFields.length / section.fields.length) * 100)
    }
  }

  const getOverallCompletion = () => {
    const allFields = SECTIONS.flatMap(s => s.fields)
    const filledFields = allFields.filter(field => formData[field]?.trim())
    return Math.round((filledFields.length / allFields.length) * 100)
  }

  const handleGenerateRfq = async (e) => {
    e.preventDefault()
    setIsGenerating(true)
    setGenerateError(null)

    try {
      const result = await generateRfqDocument(formData)
      console.log('📝 RFQ document generated:', result)

      // Extract the content from the response
      const rfqContent = result?.content || result?.response || ''

      if (rfqContent) {
        // Store the generated RFQ document in the chat store
        setRfqDocument(currentChatId, rfqContent)

        // Add a chat card for the generated RFQ
        addMessage(currentChatId, {
          id: `rfq-generated-${Date.now()}`,
          role: 'assistant',
          content: 'RFQ document has been generated. You can review and edit it before sending.',
          timestamp: new Date().toISOString(),
          actionType: 'rfq-preview',
          actionComplete: true
        })
      } else {
        setGenerateError('No content received from RFQ generator')
      }
    } catch (error) {
      console.error('Failed to generate RFQ:', error)
      setGenerateError('Failed to generate RFQ document. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const isFieldFilled = (field) => formData[field]?.trim()

  return (
    <form onSubmit={handleGenerateRfq} className="p-4 space-y-4">
      {/* RFQ ID Banner */}
      {formData.rfq_id && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-lyzr-light-1 rounded-lg px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-lyzr-mid-4" />
            <span className="text-sm text-lyzr-mid-4">RFQ ID:</span>
            <span className="font-medium text-lyzr-congo">{formData.rfq_id}</span>
          </div>
          <Badge variant="info" size="sm">Draft</Badge>
        </motion.div>
      )}

      {/* Sections */}
      {SECTIONS.map((section, index) => {
        const Icon = section.icon
        const completion = getSectionCompletion(section)
        const isExpanded = expandedSections.includes(section.id)
        const isComplete = completion.percentage === 100

        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl border border-lyzr-cream overflow-hidden"
          >
            {/* Section Header */}
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-lyzr-light-1 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                  ${isComplete ? 'bg-accent-success/10' : 'bg-lyzr-light-2'}`}
                >
                  {isComplete ? (
                    <CheckCircle className="w-4 h-4 text-accent-success" />
                  ) : (
                    <Icon className="w-4 h-4 text-lyzr-mid-4" />
                  )}
                </div>
                <div className="text-left">
                  <h3 className="font-medium text-lyzr-congo text-sm">{section.title}</h3>
                  <p className="text-xs text-lyzr-mid-4">
                    {isComplete
                      ? 'Complete'
                      : `${completion.percentage}% complete`
                    }
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-lyzr-mid-4" />
              ) : (
                <ChevronDown className="w-5 h-5 text-lyzr-mid-4" />
              )}
            </button>

            {/* Section Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-2 space-y-4 border-t border-lyzr-light-2">
                    {section.id === 'general' && (
                      <>
                        <Input
                          label="Organization Name"
                          placeholder={isFieldFilled('organization_name') ? '' : 'Waiting for response...'}
                          value={formData.organization_name}
                          onChange={(e) => handleChange('organization_name', e.target.value)}
                          required
                        />
                        <Input
                          label="Contact Person Name"
                          placeholder={isFieldFilled('contact_name') ? '' : 'Waiting for response...'}
                          value={formData.contact_name}
                          onChange={(e) => handleChange('contact_name', e.target.value)}
                          required
                        />
                        <Input
                          label="Contact Email"
                          type="email"
                          placeholder={isFieldFilled('contact_email') ? '' : 'Waiting for response...'}
                          value={formData.contact_email}
                          onChange={(e) => handleChange('contact_email', e.target.value)}
                          required
                        />
                      </>
                    )}

                    {section.id === 'procurement' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-lyzr-congo mb-1.5">
                            Procurement Type <span className="text-accent-error">*</span>
                          </label>
                          <select
                            value={formData.procurement_type}
                            onChange={(e) => handleChange('procurement_type', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-lyzr-cream rounded-lg
                              text-lyzr-black text-sm focus:outline-none focus:ring-2 focus:ring-lyzr-ferra"
                            required
                          >
                            <option value="">Select type...</option>
                            <option value="Goods">Goods</option>
                            <option value="Services">Services</option>
                            <option value="Hardware">Hardware</option>
                            <option value="Software">Software</option>
                            <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                            <option value="Consulting">Consulting</option>
                            <option value="Cybersecurity">Cybersecurity</option>
                          </select>
                        </div>
                        <Textarea
                          label="Requirement Summary"
                          placeholder={isFieldFilled('requirement_summary') ? '' : 'Describe your requirements...'}
                          value={formData.requirement_summary}
                          onChange={(e) => handleChange('requirement_summary', e.target.value)}
                          rows={4}
                          required
                        />
                        <Input
                          label="Quantity"
                          placeholder={isFieldFilled('quantity') ? '' : 'e.g., 500 units'}
                          value={formData.quantity}
                          onChange={(e) => handleChange('quantity', e.target.value)}
                          required
                        />
                      </>
                    )}

                    {section.id === 'timeline' && (
                      <>
                        <Input
                          label="Delivery Timeline"
                          placeholder={isFieldFilled('delivery_timeline') ? '' : 'e.g., Within 4 weeks of PO'}
                          value={formData.delivery_timeline}
                          onChange={(e) => handleChange('delivery_timeline', e.target.value)}
                          required
                        />
                        <div>
                          <Input
                            label="Budget Range"
                            placeholder={isFieldFilled('budget_range') ? '' : 'e.g., $50,000 - $100,000'}
                            value={formData.budget_range}
                            onChange={(e) => handleChange('budget_range', e.target.value)}
                            required
                          />
                          
                          {/* AI Price Recommendation Section */}
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-3 space-y-2"
                          >
                            {/* Loading State - Auto or Manual */}
                            {(isLoadingPrice || rfqData?.isPricingLoading) && (
                              <motion.div
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-lyzr-light-2 border border-lyzr-cream"
                              >
                                <motion.div
                                  animate={{ opacity: [0.4, 1, 0.4] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="text-xs font-medium text-lyzr-congo flex items-center gap-2"
                                >
                                  <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="w-2 h-2 rounded-full bg-accent-success"
                                  />
                                  Analyzing AI Recommendation Price...
                                </motion.div>
                              </motion.div>
                            )}
                            
                            {/* Auto or Manual Suggested Price Display */}
                            {rfqData?.suggestedPrice && !isLoadingPrice && !rfqData?.isPricingLoading && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-success/10 border border-accent-success/20"
                              >
                                <span className="text-xs text-lyzr-mid-4">AI Suggested:</span>
                                <span className="text-sm font-bold text-accent-success">${rfqData.suggestedPrice.toLocaleString()}</span>
                                <button
                                  type="button"
                                  onClick={handleAcceptSuggestedPrice}
                                  title="Accept suggested price"
                                  className="ml-auto p-1 hover:bg-accent-success/20 rounded transition-colors"
                                >
                                  <ThumbsUp className="w-4 h-4 text-accent-success" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRejectSuggestedPrice}
                                  title="Reject suggested price"
                                  className="p-1 hover:bg-accent-error/20 rounded transition-colors"
                                >
                                  <ThumbsDown className="w-4 h-4 text-accent-error" />
                                </button>
                              </motion.div>
                            )}
                            
                            {/* Validation Error */}
                            {pricingValidationError && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-2 bg-accent-error/10 border border-accent-error/20 rounded-lg"
                              >
                                <AlertCircle className="w-3.5 h-3.5 text-accent-error flex-shrink-0" />
                                <span className="text-xs text-accent-error">{pricingValidationError}</span>
                              </motion.div>
                            )}
                            
                            {/* Price Error */}
                            {priceError && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-2 bg-accent-error/10 border border-accent-error/20 rounded-lg"
                              >
                                <AlertCircle className="w-3.5 h-3.5 text-accent-error flex-shrink-0" />
                                <span className="text-xs text-accent-error">{priceError}</span>
                              </motion.div>
                            )}
                            
                            {/* Manual AI Recommendation Button (show only if no auto suggestion) */}
                            {!rfqData?.suggestedPrice && (
                              <button
                                type="button"
                                onClick={handleAIPriceRecommendation}
                                disabled={isLoadingPrice}
                                className="w-full text-xs px-3 py-2 bg-lyzr-light-2 hover:bg-lyzr-cream text-lyzr-congo rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 border border-lyzr-cream"
                              >
                                <Zap className="w-3 h-3" />
                                {isLoadingPrice ? 'Analyzing AI Recommendation Price...' : 'Get AI Recommendation'}
                              </button>
                            )}
                          </motion.div>
                        </div>
                        <Input
                          label="Response Deadline"
                          type="date"
                          value={formData.response_deadline}
                          onChange={(e) => handleChange('response_deadline', e.target.value)}
                          required
                        />
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}

      {/* Feedback Tooltip */}
      <AnimatePresence>
        {showFeedbackTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="fixed bottom-20 right-6 z-50 bg-white rounded-lg shadow-lg p-3 max-w-xs border border-lyzr-cream"
          >
            {isSubmittingFeedback ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-2"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6 }}
                  className="text-xl text-accent-success"
                >
                  ✓
                </motion.div>
                <p className="text-xs text-lyzr-congo font-medium mt-1">Thanks for feedback!</p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-lyzr-mid-4 font-medium">Why did you reject this?</p>
                <input
                  type="text"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Brief feedback..."
                  className="w-full px-2 py-1.5 text-xs border border-lyzr-cream rounded-lg focus:outline-none focus:ring-1 focus:ring-accent-success/50"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFeedbackTooltip(false)}
                    className="flex-1 px-2 py-1 text-xs border border-lyzr-cream text-lyzr-congo rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitFeedback}
                    disabled={!feedbackText.trim()}
                    className="flex-1 px-2 py-1 text-xs bg-accent-success text-white rounded-lg hover:bg-accent-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Banner */}
      <Card className="bg-accent-cool/5 border-accent-cool/20">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-accent-cool flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-lyzr-congo font-medium">Continue chatting to fill the form</p>
            <p className="text-xs text-lyzr-mid-4 mt-1">
              The form fields will be automatically populated based on your conversation with the AI assistant.
            </p>
          </div>
        </div>
      </Card>

      {/* Progress Bar */}
      <div className="bg-lyzr-light-1 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-lyzr-congo">Form Completion</span>
          <span className="text-sm text-lyzr-ferra font-medium">{getOverallCompletion()}%</span>
        </div>
        <div className="h-2 bg-lyzr-cream rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${getOverallCompletion()}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-lyzr-ferra rounded-full"
          />
        </div>
      </div>

      {/* Error Message */}
      {generateError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-accent-error/10 border border-accent-error/20 rounded-lg px-4 py-3 flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 text-accent-error flex-shrink-0" />
          <p className="text-sm text-accent-error">{generateError}</p>
        </motion.div>
      )}

      {/* Generate RFQ Button */}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        loading={isGenerating}
        disabled={getOverallCompletion() < 50}
      >
        <Sparkles className="w-4 h-4" />
        {isGenerating ? 'Generating RFQ Document...' : 'Generate RFQ Document'}
      </Button>

      {getOverallCompletion() < 50 && (
        <p className="text-xs text-center text-lyzr-mid-4">
          Complete at least 50% of the form to generate
        </p>
      )}
    </form>
  )
}