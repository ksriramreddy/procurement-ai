import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Target,
  DollarSign,
  Calendar,
  Shield,
  Scale,
  Hash,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Info
} from 'lucide-react'
import Input, { Textarea } from '../ui/Input'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import { useChatStore } from '../../store/chatStore'

const SECTIONS = [
  {
    id: 'parties',
    title: 'Parties',
    icon: Users,
    fields: ['vendor_name', 'customer_name']
  },
  {
    id: 'scope_fees',
    title: 'Scope & Fees',
    icon: DollarSign,
    fields: ['scope', 'fee_amount', 'fee_currency', 'payment_terms']
  },
  {
    id: 'term_legal',
    title: 'Term & Legal',
    icon: Scale,
    fields: ['start_date', 'end_date', 'liability_cap', 'governing_law']
  }
]

export default function ContractForm({ contractData }) {
  const { currentChatId } = useChatStore()

  const [formData, setFormData] = useState({
    vendor_name: '',
    customer_name: '',
    scope: '',
    fee_amount: '',
    fee_currency: 'USD',
    payment_terms: '',
    start_date: '',
    end_date: '',
    confidentiality: true,
    liability_cap: '',
    governing_law: ''
  })

  const [expandedSections, setExpandedSections] = useState(['parties'])

  // Update form when contractData changes
  useEffect(() => {
    if (contractData) {
      setFormData({
        vendor_name: contractData.vendorName || '',
        customer_name: contractData.customerName || '',
        scope: contractData.scope || '',
        fee_amount: contractData.feeAmount || '',
        fee_currency: contractData.feeCurrency || 'USD',
        payment_terms: contractData.paymentTerms || '',
        start_date: contractData.startDate
          ? contractData.startDate.split('T')[0]
          : '',
        end_date: contractData.endDate
          ? contractData.endDate.split('T')[0]
          : '',
        confidentiality: contractData.confidentiality ?? true,
        liability_cap: contractData.liabilityCap || '',
        governing_law: contractData.governingLaw || ''
      })

      // Expand all sections if data is populated
      if (contractData.vendorName || contractData.customerName) {
        setExpandedSections(['parties', 'scope_fees', 'term_legal'])
      }
    }
  }, [contractData])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const toggleSection = (sectionId) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const getSectionCompletion = (section) => {
    const filledFields = section.fields.filter(field => {
      const val = formData[field]
      return typeof val === 'string' ? val.trim() : val != null
    })
    return {
      filled: filledFields.length,
      total: section.fields.length,
      percentage: Math.round((filledFields.length / section.fields.length) * 100)
    }
  }

  const getOverallCompletion = () => {
    const allFields = SECTIONS.flatMap(s => s.fields)
    const filledFields = allFields.filter(field => {
      const val = formData[field]
      return typeof val === 'string' ? val.trim() : val != null
    })
    return Math.round((filledFields.length / allFields.length) * 100)
  }

  const isFieldFilled = (field) => {
    const val = formData[field]
    return typeof val === 'string' ? val.trim() : val != null
  }

  return (
    <div className="p-4 space-y-4">
      {/* Confidentiality Badge */}
      {formData.confidentiality && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-lyzr-light-1 rounded-lg px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent-success" />
            <span className="text-sm text-lyzr-congo font-medium">Confidentiality clause enabled</span>
          </div>
          <Badge variant="success" size="sm">Active</Badge>
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
                    {section.id === 'parties' && (
                      <>
                        <Input
                          label="Vendor Name"
                          placeholder={isFieldFilled('vendor_name') ? '' : 'Vendor organization name...'}
                          value={formData.vendor_name}
                          onChange={(e) => handleChange('vendor_name', e.target.value)}
                          required
                        />
                        <Input
                          label="Customer Name"
                          placeholder={isFieldFilled('customer_name') ? '' : 'Customer organization name...'}
                          value={formData.customer_name}
                          onChange={(e) => handleChange('customer_name', e.target.value)}
                          required
                        />
                      </>
                    )}

                    {section.id === 'scope_fees' && (
                      <>
                        <Textarea
                          label="Scope of Work"
                          placeholder={isFieldFilled('scope') ? '' : 'Describe the services or deliverables...'}
                          value={formData.scope}
                          onChange={(e) => handleChange('scope', e.target.value)}
                          rows={4}
                          required
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Fee Amount"
                            placeholder={isFieldFilled('fee_amount') ? '' : 'e.g., 150000'}
                            value={formData.fee_amount}
                            onChange={(e) => handleChange('fee_amount', e.target.value)}
                            required
                          />
                          <div>
                            <label className="block text-sm font-medium text-lyzr-congo mb-1.5">
                              Currency
                            </label>
                            <select
                              value={formData.fee_currency}
                              onChange={(e) => handleChange('fee_currency', e.target.value)}
                              className="w-full px-4 py-2.5 bg-white border border-lyzr-cream rounded-lg
                                text-lyzr-black text-sm focus:outline-none focus:ring-2 focus:ring-lyzr-ferra"
                            >
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                              <option value="GBP">GBP</option>
                              <option value="INR">INR</option>
                            </select>
                          </div>
                        </div>
                        <Input
                          label="Payment Terms"
                          placeholder={isFieldFilled('payment_terms') ? '' : 'e.g., Net 30 days, quarterly in advance'}
                          value={formData.payment_terms}
                          onChange={(e) => handleChange('payment_terms', e.target.value)}
                          required
                        />
                      </>
                    )}

                    {section.id === 'term_legal' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            label="Start Date"
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => handleChange('start_date', e.target.value)}
                            required
                          />
                          <Input
                            label="End Date"
                            type="date"
                            value={formData.end_date}
                            onChange={(e) => handleChange('end_date', e.target.value)}
                            required
                          />
                        </div>
                        <Input
                          label="Liability Cap"
                          placeholder={isFieldFilled('liability_cap') ? '' : 'e.g., 150000'}
                          value={formData.liability_cap}
                          onChange={(e) => handleChange('liability_cap', e.target.value)}
                          required
                        />
                        <Input
                          label="Governing Law"
                          placeholder={isFieldFilled('governing_law') ? '' : 'e.g., Delaware, State of California'}
                          value={formData.governing_law}
                          onChange={(e) => handleChange('governing_law', e.target.value)}
                          required
                        />
                        <div className="flex items-center justify-between px-1 py-2">
                          <label className="text-sm font-medium text-lyzr-congo">Confidentiality Clause</label>
                          <button
                            type="button"
                            onClick={() => handleChange('confidentiality', !formData.confidentiality)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                              formData.confidentiality ? 'bg-accent-success' : 'bg-lyzr-cream'
                            }`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                              formData.confidentiality ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}

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
    </div>
  )
}
