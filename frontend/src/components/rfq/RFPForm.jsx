import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  FileText,
  Hash,
  Calendar,
  Mail,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Info,
  ClipboardList,
  Target,
  Sparkles,
  ListPlus
} from 'lucide-react'
import Input, { Textarea } from '../ui/Input'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import { generateRfpDocument } from '../../services/api'
import { useChatStore } from '../../store/chatStore'

const SECTIONS = [
  {
    id: 'project',
    title: 'Project Information',
    icon: Building2,
    fields: ['rfp_id', 'issued_by', 'project_title']
  },
  {
    id: 'requirements',
    title: 'Scope & Requirements',
    icon: Target,
    fields: ['scope', 'mandatory_requirements', 'evaluation_basis']
  },
  {
    id: 'submission',
    title: 'Submission Details',
    icon: Calendar,
    fields: ['submission_deadline', 'contact_channel']
  }
]

export default function RFPForm({ rfpData }) {
  const { currentChatId, setRfpData, setRfpDocument, addMessage } = useChatStore()

  const [formData, setFormData] = useState({
    rfp_id: '',
    issued_by: '',
    project_title: '',
    scope: '',
    mandatory_requirements: '',
    submission_deadline: '',
    evaluation_basis: '',
    contact_channel: '',
    additional_info: ''
  })

  // Dynamic additional fields from agent: [{field_name, field_value, field_type}]
  const [additionalFields, setAdditionalFields] = useState([])

  const [expandedSections, setExpandedSections] = useState(['project'])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(null)

  // Update form when rfpData changes
  useEffect(() => {
    if (rfpData) {
      setFormData(prev => ({
        ...prev,
        rfp_id: rfpData.rfpId || '',
        issued_by: rfpData.issuedBy || '',
        project_title: rfpData.projectTitle || '',
        scope: rfpData.scope || '',
        mandatory_requirements: rfpData.mandatoryRequirements || '',
        submission_deadline: rfpData.submissionDeadline
          ? rfpData.submissionDeadline.split('T')[0]
          : '',
        evaluation_basis: rfpData.evaluationBasis || '',
        contact_channel: rfpData.contactChannel || ''
      }))

      // Populate additional fields from agent
      if (rfpData.additionalFields?.length > 0) {
        setAdditionalFields(rfpData.additionalFields.map(f => ({
          field_name: f.field_name || '',
          field_value: f.field_value || '',
          field_type: f.field_type || 'string'
        })))
      }

      // Expand all sections if data is populated
      const sectionsToExpand = ['project', 'requirements', 'submission']
      if (rfpData.additionalFields?.length > 0) {
        sectionsToExpand.push('additional')
      }
      if (rfpData.projectTitle || rfpData.issuedBy) {
        setExpandedSections(sectionsToExpand)
      }
    }
  }, [rfpData])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAdditionalFieldChange = (index, value) => {
    setAdditionalFields(prev => prev.map((f, i) => i === index ? { ...f, field_value: value } : f))
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

  const handleGenerateRfp = async (e) => {
    e.preventDefault()
    setIsGenerating(true)
    setGenerateError(null)

    try {
      const result = await generateRfpDocument({
        ...formData,
        additional_fields: additionalFields.filter(f => f.field_value?.trim())
      })

      // Extract content from the response
      let rfpContent = ''
      let rfpMessage = ''

      if (result?.response?.content) {
        rfpContent = result.response.content
        rfpMessage = result.response.message || ''
      } else if (result?.content) {
        rfpContent = result.content
        rfpMessage = result.message || ''
      } else if (typeof result === 'string') {
        try {
          const parsed = JSON.parse(result)
          rfpContent = parsed?.content || parsed?.response?.content || ''
          rfpMessage = parsed?.message || ''
        } catch {
          rfpContent = result
        }
      }

      if (rfpContent) {
        // Store the generated RFP document in the chat store
        setRfpDocument(currentChatId, rfpContent)

        // Add a chat card for the generated RFP
        addMessage(currentChatId, {
          id: `rfp-generated-${Date.now()}`,
          role: 'assistant',
          content: 'RFP document has been generated. You can review and edit it before sending.',
          timestamp: new Date().toISOString(),
          actionType: 'rfp-preview',
          actionComplete: true
        })

        // Display the agent's message in chat if present
        if (rfpMessage) {
          addMessage(currentChatId, {
            id: `rfp-agent-message-${Date.now()}`,
            role: 'assistant',
            content: rfpMessage,
            timestamp: new Date().toISOString()
          })
        }
      } else {
        setGenerateError('No content received from RFP generator')
      }
    } catch (error) {
      setGenerateError('Failed to generate RFP document. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const isFieldFilled = (field) => formData[field]?.trim()

  return (
    <form onSubmit={handleGenerateRfp} className="p-4 space-y-4">
      {/* RFP ID Banner */}
      {formData.rfp_id && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-lyzr-light-1 rounded-lg px-4 py-3 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-lyzr-mid-4" />
            <span className="text-sm text-lyzr-mid-4">RFP ID:</span>
            <span className="font-medium text-lyzr-congo">{formData.rfp_id}</span>
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
                    {section.id === 'project' && (
                      <>
                        <Input
                          label="RFP ID"
                          placeholder={isFieldFilled('rfp_id') ? '' : 'Auto-generated or provide manually'}
                          value={formData.rfp_id}
                          onChange={(e) => handleChange('rfp_id', e.target.value)}
                        />
                        <Input
                          label="Issued By"
                          placeholder={isFieldFilled('issued_by') ? '' : 'Organization name...'}
                          value={formData.issued_by}
                          onChange={(e) => handleChange('issued_by', e.target.value)}
                          required
                        />
                        <Input
                          label="Project Title"
                          placeholder={isFieldFilled('project_title') ? '' : 'Waiting for response...'}
                          value={formData.project_title}
                          onChange={(e) => handleChange('project_title', e.target.value)}
                          required
                        />
                      </>
                    )}

                    {section.id === 'requirements' && (
                      <>
                        <Textarea
                          label="Scope"
                          placeholder={isFieldFilled('scope') ? '' : 'Describe what the vendor must deliver...'}
                          value={formData.scope}
                          onChange={(e) => handleChange('scope', e.target.value)}
                          rows={4}
                          required
                        />
                        <Textarea
                          label="Mandatory Requirements"
                          placeholder={isFieldFilled('mandatory_requirements') ? '' : 'Hard requirements (leave empty if none)...'}
                          value={formData.mandatory_requirements}
                          onChange={(e) => handleChange('mandatory_requirements', e.target.value)}
                          rows={3}
                        />
                        <div>
                          <label className="block text-sm font-medium text-lyzr-congo mb-1.5">
                            Evaluation Basis
                          </label>
                          <select
                            value={formData.evaluation_basis}
                            onChange={(e) => handleChange('evaluation_basis', e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-lyzr-cream rounded-lg
                              text-lyzr-black text-sm focus:outline-none focus:ring-2 focus:ring-lyzr-ferra"
                          >
                            <option value="">Select evaluation basis...</option>
                            <option value="TECHNICAL_ONLY">Technical Only</option>
                            <option value="COMMERCIAL_ONLY">Commercial Only</option>
                            <option value="TECHNICAL_PLUS_COMMERCIAL">Technical + Commercial</option>
                          </select>
                        </div>
                      </>
                    )}

                    {section.id === 'submission' && (
                      <>
                        <Input
                          label="Submission Deadline"
                          type="date"
                          value={formData.submission_deadline}
                          onChange={(e) => handleChange('submission_deadline', e.target.value)}
                          required
                        />
                        <Input
                          label="Contact Channel"
                          placeholder={isFieldFilled('contact_channel') ? '' : 'Email or official channel...'}
                          value={formData.contact_channel}
                          onChange={(e) => handleChange('contact_channel', e.target.value)}
                        />
                        <Textarea
                          label="Additional Info"
                          placeholder="Any additional requirements or notes (optional)"
                          value={formData.additional_info}
                          onChange={(e) => handleChange('additional_info', e.target.value)}
                          rows={3}
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

      {/* Additional Fields Section (dynamic from agent) */}
      {additionalFields.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: SECTIONS.length * 0.1 }}
          className="bg-white rounded-xl border border-lyzr-cream overflow-hidden"
        >
          <button
            type="button"
            onClick={() => toggleSection('additional')}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-lyzr-light-1 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                ${additionalFields.every(f => f.field_value?.trim()) ? 'bg-accent-success/10' : 'bg-lyzr-light-2'}`}
              >
                {additionalFields.every(f => f.field_value?.trim()) ? (
                  <CheckCircle className="w-4 h-4 text-accent-success" />
                ) : (
                  <ListPlus className="w-4 h-4 text-lyzr-mid-4" />
                )}
              </div>
              <div className="text-left">
                <h3 className="font-medium text-lyzr-congo text-sm">Additional Details</h3>
                <p className="text-xs text-lyzr-mid-4">
                  {additionalFields.every(f => f.field_value?.trim())
                    ? 'Complete'
                    : `${Math.round((additionalFields.filter(f => f.field_value?.trim()).length / additionalFields.length) * 100)}% complete`
                  }
                </p>
              </div>
            </div>
            {expandedSections.includes('additional') ? (
              <ChevronUp className="w-5 h-5 text-lyzr-mid-4" />
            ) : (
              <ChevronDown className="w-5 h-5 text-lyzr-mid-4" />
            )}
          </button>

          <AnimatePresence>
            {expandedSections.includes('additional') && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 pt-2 space-y-4 border-t border-lyzr-light-2">
                  {additionalFields.map((field, idx) => {
                    const label = field.field_name
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, c => c.toUpperCase())

                    if (field.field_type === 'date') {
                      return (
                        <Input
                          key={idx}
                          label={label}
                          type="date"
                          value={field.field_value}
                          onChange={(e) => handleAdditionalFieldChange(idx, e.target.value)}
                        />
                      )
                    }

                    if (field.field_value?.length > 80 || field.field_value?.includes(';')) {
                      return (
                        <Textarea
                          key={idx}
                          label={label}
                          value={field.field_value}
                          onChange={(e) => handleAdditionalFieldChange(idx, e.target.value)}
                          rows={3}
                        />
                      )
                    }

                    return (
                      <Input
                        key={idx}
                        label={label}
                        type={field.field_type === 'number' ? 'number' : 'text'}
                        value={field.field_value}
                        onChange={(e) => handleAdditionalFieldChange(idx, e.target.value)}
                      />
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

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

      {/* Generate RFP Button */}
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        loading={isGenerating}
        disabled={getOverallCompletion() < 50}
      >
        <Sparkles className="w-4 h-4" />
        {isGenerating ? 'Generating RFP Document...' : 'Create RFP Document'}
      </Button>

      {getOverallCompletion() < 50 && (
        <p className="text-xs text-center text-lyzr-mid-4">
          Complete at least 50% of the form to generate
        </p>
      )}
    </form>
  )
}
