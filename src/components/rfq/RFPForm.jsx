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
  Info,
  ClipboardList,
  Target
} from 'lucide-react'
import Input, { Textarea } from '../ui/Input'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
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
  const { currentChatId, setRfpData } = useChatStore()

  const [formData, setFormData] = useState({
    rfp_id: '',
    issued_by: '',
    project_title: '',
    scope: '',
    mandatory_requirements: '',
    submission_deadline: '',
    evaluation_basis: '',
    contact_channel: ''
  })

  const [expandedSections, setExpandedSections] = useState(['project'])

  // Update form when rfpData changes
  useEffect(() => {
    if (rfpData) {
      setFormData({
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
      })

      // Expand all sections if data is populated
      if (rfpData.projectTitle || rfpData.issuedBy) {
        setExpandedSections(['project', 'requirements', 'submission'])
      }
    }
  }, [rfpData])

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

  const isFieldFilled = (field) => formData[field]?.trim()

  return (
    <div className="p-4 space-y-4">
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
