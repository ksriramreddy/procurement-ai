import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, ArrowLeft, CheckCircle, FileText, ClipboardList, Scale, Loader } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { callCertificationAgent } from '../../services/api'
import { sendDocumentToVendors, uploadDocumentToS3 } from '../../services/backendApi'
import Button from '../ui/Button'
import VendorTable from '../vendors/VendorTable'
import VendorDetails from '../vendors/VendorDetails'
import RFQForm from '../rfq/RFQForm'
import RFPForm from '../rfq/RFPForm'
import ContractForm from '../rfq/ContractForm'
import RFQPdfPreview from '../rfq/RFQPdfPreview'

export default function DetailPanel() {
  const {
    currentChat,
    currentChatId,
    detailPanelType,
    selectedVendor,
    hideDetailPanel,
    setSelectedVendor,
    showDetailPanel,
    addMessage,
    setPendingChatMessage,
    setSelectedVendorsForRfq
  } = useChatStore()

  const [showRfqSuccess, setShowRfqSuccess] = useState(false)

  const [isSendingToVendors, setIsSendingToVendors] = useState(false)

  const handleClose = () => {
    hideDetailPanel()
  }

  const handleBackFromVendorDetails = () => {
    setSelectedVendor(null)
  }

  const handleBackToRfqForm = () => {
    showDetailPanel('rfq')
  }

  // Handle "Send RFQ" from vendor table
  const handleSendRfqFromVendor = async (selectedVendors) => {
    // Handle both single vendor and array of vendors
    const vendors = Array.isArray(selectedVendors) ? selectedVendors : [selectedVendors]
    const vendorNames = vendors.map(v => v.name).join(', ')

    const rfqData = currentChat?.rfqData
    const hasRfqDetails = rfqData && (
      rfqData.organizationName || rfqData.requirementSummary || rfqData.procurementType
    )

    // Parse budget to integer price
    const parseBudgetToInt = (budgetStr) => {
      if (!budgetStr) return null
      const cleaned = budgetStr.replace(/[^0-9.]/g, '')
      const num = parseFloat(cleaned)
      if (isNaN(num)) return null
      const lower = budgetStr.toLowerCase()
      if (lower.includes('billion') || lower.includes('bn')) return Math.round(num * 1000000000)
      if (lower.includes('million') || lower.includes('mn')) return Math.round(num * 1000000)
      if (lower.includes('thousand') || lower.includes('k')) return Math.round(num * 1000)
      return Math.round(num)
    }

    setIsSendingToVendors(true)

    // Step 1: Call certification agent to get mandatory/good_to_have/summary
    let certificationData = { mandatory: [], good_to_have: [], summary: '' }
    if (rfqData) {
      try {
        certificationData = await callCertificationAgent({
          rfq_id: rfqData.rfqId || '',
          organization_name: rfqData.organizationName || '',
          contact_name: rfqData.contactName || '',
          contact_email: rfqData.contactEmail || '',
          procurement_type: rfqData.procurementType || '',
          requirement_summary: rfqData.requirementSummary || '',
          quantity: rfqData.quantity || '',
          delivery_timeline: rfqData.deliveryTimeline || '',
          budget_range: rfqData.budgetRange || '',
          response_deadline: rfqData.responseDeadline || '',
          additional_fields: rfqData.additionalFields || []
        }, currentChat?.sessionId)
      } catch (err) {
        console.warn('[DetailPanel] certification agent failed:', err.message)
      }
    }

    // Step 2: Send vendors + certification data to backend
    const subject = rfqData?.requirementSummary || rfqData?.procurementType || 'RFQ Request'
    const quotedPrice = parseBudgetToInt(rfqData?.budgetRange)
    let sendResult = null
    try {
      sendResult = await sendDocumentToVendors({
        vendors,
        documentType: 'RFQ',
        subject,
        quotedPrice,
        documentContent: currentChat?.rfqDocument || null,
        certificationData
      })
    } catch (err) {
      console.warn('[DetailPanel] sendDocumentToVendors failed:', err.message)
    }

    // Step 3: Upload RFQ document to S3 for each vendor thread
    if (sendResult && currentChat?.rfqDocument) {
      const allResults = [...(sendResult.created_vendors || []), ...(sendResult.updated_vendors || [])]
      if (allResults.length > 0) {
        const docBlob = new Blob([currentChat.rfqDocument], { type: 'application/pdf' })
        const filename = `RFQ_${new Date().toISOString().split('T')[0]}.pdf`
        await Promise.all(
          allResults.map(v =>
            uploadDocumentToS3({ fileBlob: docBlob, filename, documentType: 'RFQ', threadId: v.thread_id })
              .catch(err => console.warn(`[DetailPanel] S3 upload failed for ${v.vendor_name}:`, err.message))
          )
        )
      }
    }

    setIsSendingToVendors(false)

    if (hasRfqDetails && currentChat?.rfqDocument) {
      // RFQ details are filled AND document is generated
      setShowRfqSuccess(true)

      addMessage(currentChatId, {
        id: `rfq-vendor-sent-${Date.now()}`,
        role: 'assistant',
        content: `RFQ has been submitted to ${vendorNames} successfully.`,
        timestamp: new Date().toISOString(),
        actionType: 'rfq-sent',
        actionComplete: true
      })

      setTimeout(() => setShowRfqSuccess(false), 3000)
    } else {
      // No RFQ details - auto-fill chat with RFQ request
      hideDetailPanel()
      setPendingChatMessage({
        message: `I want to create an RFQ for ${vendorNames}`,
        autoSend: true
      })
    }
  }

  // Handle "Send RFP" from vendor table
  const handleSendRfpFromVendor = async (selectedVendors) => {
    const vendors = Array.isArray(selectedVendors) ? selectedVendors : [selectedVendors]
    const vendorNames = vendors.map(v => v.name).join(', ')

    const rfpData = currentChat?.rfpData
    const hasRfpDetails = rfpData && (
      rfpData.projectTitle || rfpData.scope || rfpData.issuedBy
    )

    const parseBudgetToInt = (budgetStr) => {
      if (!budgetStr) return null
      const cleaned = budgetStr.replace(/[^0-9.]/g, '')
      const num = parseFloat(cleaned)
      if (isNaN(num)) return null
      const lower = budgetStr.toLowerCase()
      if (lower.includes('billion') || lower.includes('bn')) return Math.round(num * 1000000000)
      if (lower.includes('million') || lower.includes('mn')) return Math.round(num * 1000000)
      if (lower.includes('thousand') || lower.includes('k')) return Math.round(num * 1000)
      return Math.round(num)
    }

    if (hasRfpDetails && currentChat?.rfpDocument) {
      // RFP form is filled AND document is generated — send directly
      setIsSendingToVendors(true)

      let certificationData = { mandatory: [], good_to_have: [], summary: '' }
      try {
        certificationData = await callCertificationAgent({
          organization_name: rfpData.issuedBy || '',
          contact_name: '',
          contact_email: '',
          procurement_type: 'Services',
          requirement_summary: rfpData.projectTitle || '',
          quantity: '',
          delivery_timeline: rfpData.submissionDeadline || '',
          budget_range: rfpData.budget || '',
          response_deadline: rfpData.submissionDeadline || '',
          additional_fields: rfpData.additionalFields || []
        }, currentChat?.sessionId)
      } catch (err) {
        console.warn('[DetailPanel] certification agent failed for RFP:', err.message)
      }

      const subject = rfpData.projectTitle || 'RFP Request'
      const quotedPrice = parseBudgetToInt(rfpData.budget)
      let sendResult = null
      try {
        sendResult = await sendDocumentToVendors({
          vendors,
          documentType: 'RFP',
          subject,
          quotedPrice,
          documentContent: currentChat?.rfpDocument || null,
          certificationData
        })
      } catch (err) {
        console.warn('[DetailPanel] sendDocumentToVendors (RFP) failed:', err.message)
      }

      // Upload RFP document to S3 for each vendor thread
      if (sendResult && currentChat?.rfpDocument) {
        const allResults = [...(sendResult.created_vendors || []), ...(sendResult.updated_vendors || [])]
        if (allResults.length > 0) {
          const docBlob = new Blob([currentChat.rfpDocument], { type: 'application/pdf' })
          const filename = `RFP_${new Date().toISOString().split('T')[0]}.pdf`
          await Promise.all(
            allResults.map(v =>
              uploadDocumentToS3({ fileBlob: docBlob, filename, documentType: 'RFP', threadId: v.thread_id })
                .catch(err => console.warn(`[DetailPanel] S3 upload (RFP) failed for ${v.vendor_name}:`, err.message))
            )
          )
        }
      }

      setIsSendingToVendors(false)
      setShowRfqSuccess(true)

      addMessage(currentChatId, {
        id: `rfp-vendor-sent-${Date.now()}`,
        role: 'assistant',
        content: `RFP has been submitted to ${vendorNames} successfully.`,
        timestamp: new Date().toISOString(),
        actionType: 'rfp-sent',
        actionComplete: true
      })

      setTimeout(() => setShowRfqSuccess(false), 3000)
    } else {
      // No RFP details — auto-send chat message
      hideDetailPanel()
      setPendingChatMessage({
        message: `I want to create an RFP for ${vendorNames}`,
        autoSend: true
      })
    }
  }

  const getPanelTitle = () => {
    switch (detailPanelType) {
      case 'vendors':
        return selectedVendor ? 'Vendor Details' : 'Vendor Search Results'
      case 'vendor-details':
        return 'Vendor Details'
      case 'rfq':
        return 'New RFQ Request'
      case 'rfp':
        return 'New RFP Request'
      case 'contract':
        return 'New Contract'
      case 'rfq-preview':
        return 'RFQ Document'
      case 'rfp-preview':
        return 'RFP Document'
      case 'contract-preview':
        return 'Contract Document'
      default:
        return 'Details'
    }
  }

  const getSubtitle = () => {
    if (detailPanelType === 'vendors' && !selectedVendor) {
      const totalVendors = (currentChat?.vendors?.length || 0) + (currentChat?.externalVendors?.length || 0)
      return `${totalVendors} supplier${totalVendors !== 1 ? 's' : ''} found`
    }
    if (detailPanelType === 'rfq') {
      return 'Details will be auto filled from conversations or file uploads'
    }
    if (detailPanelType === 'rfp') {
      return 'Details will be auto filled from conversations'
    }
    if (detailPanelType === 'contract') {
      return 'Details will be auto filled from conversations'
    }
    if (detailPanelType === 'rfq-preview' || detailPanelType === 'rfp-preview' || detailPanelType === 'contract-preview') {
      return 'Review and edit before sending'
    }
    return null
  }

  const isFormPanel = detailPanelType === 'rfq' || detailPanelType === 'rfp' || detailPanelType === 'contract'

  const formTabs = [
    { id: 'rfq', label: 'RFQ', icon: FileText },
    { id: 'rfp', label: 'RFP', icon: ClipboardList },
    { id: 'contract', label: 'Contract', icon: Scale }
  ]

  const showBackButton = selectedVendor || detailPanelType === 'vendor-details' || detailPanelType === 'rfq-preview' || detailPanelType === 'rfp-preview' || detailPanelType === 'contract-preview'

  const handleBack = () => {
    if (detailPanelType === 'rfq-preview') {
      handleBackToRfqForm()
    } else if (detailPanelType === 'rfp-preview') {
      showDetailPanel('rfp')
    } else if (detailPanelType === 'contract-preview') {
      showDetailPanel('contract')
    } else {
      handleBackFromVendorDetails()
    }
  }

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Sending / Success Popup */}
      <AnimatePresence>
        {isSendingToVendors && (
          <motion.div
            key="sending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/30 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-lyzr-ferra/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader className="w-8 h-8 text-lyzr-ferra animate-spin" />
              </div>
              <h3 className="font-playfair text-lg font-semibold text-lyzr-congo mb-2">
                Processing Document
              </h3>
              <p className="text-sm text-lyzr-mid-4">
                Fetching certification requirements and sending to vendors...
              </p>
            </motion.div>
          </motion.div>
        )}

        {showRfqSuccess && !isSendingToVendors && (
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/30 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-accent-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-accent-success" />
              </div>
              <h3 className="font-playfair text-lg font-semibold text-lyzr-congo mb-2">
                Submitted Successfully
              </h3>
              <p className="text-sm text-lyzr-mid-4">
                Your document has been sent to the selected vendors.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-4 py-4 border-b border-lyzr-cream flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="p-1.5 hover:bg-lyzr-light-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-lyzr-congo" />
            </button>
          )}
          <div>
            <h2 className="font-noto font-semibold text-lyzr-congo">{getPanelTitle()}</h2>
            {getSubtitle() && (
              <p className="text-xs text-lyzr-mid-4 mt-0.5">{getSubtitle()}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {detailPanelType === 'vendors' && !selectedVendor && (
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4" />
              <span>CSV</span>
            </Button>
          )}
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-lyzr-light-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-lyzr-congo" />
          </button>
        </div>
      </div>

      {/* Form Switcher Tabs */}
      {isFormPanel && (
        <div className="px-4 py-2 border-b border-lyzr-cream bg-lyzr-light-1/50">
          <div className="flex gap-1 bg-lyzr-light-2 rounded-lg p-1">
            {formTabs.map((tab) => {
              const TabIcon = tab.icon
              const isActive = detailPanelType === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => showDetailPanel(tab.id)}
                  className={`
                    flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium
                    transition-all duration-200
                    ${isActive
                      ? 'bg-white text-lyzr-congo shadow-sm'
                      : 'text-lyzr-mid-4 hover:text-lyzr-congo hover:bg-white/50'
                    }
                  `}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {detailPanelType === 'vendors' && !selectedVendor && (
            <motion.div
              key="vendors"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <VendorTable
                internalVendors={currentChat?.vendors || []}
                externalVendors={currentChat?.externalVendors || []}
                onSelectVendor={setSelectedVendor}
                onSendRfq={handleSendRfqFromVendor}
                onSendRfp={handleSendRfpFromVendor}
                savedSelectedVendors={currentChat?.selectedVendorsForRfq || []}
                onSelectionChange={(vendors) => setSelectedVendorsForRfq(currentChatId, vendors)}
              />
            </motion.div>
          )}

          {(detailPanelType === 'vendor-details' || selectedVendor) && (
            <motion.div
              key="vendor-details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <VendorDetails vendor={selectedVendor} />
            </motion.div>
          )}

          {detailPanelType === 'rfq' && (
            <motion.div
              key="rfq"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <RFQForm rfqData={currentChat?.rfqData} />
            </motion.div>
          )}

          {detailPanelType === 'rfp' && (
            <motion.div
              key="rfp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <RFPForm rfpData={currentChat?.rfpData} />
            </motion.div>
          )}

          {detailPanelType === 'contract' && (
            <motion.div
              key="contract"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ContractForm contractData={currentChat?.contractData} />
            </motion.div>
          )}

          {detailPanelType === 'rfq-preview' && (
            <motion.div
              key="rfq-preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <RFQPdfPreview rfqDocument={currentChat?.rfqDocument} />
            </motion.div>
          )}

          {detailPanelType === 'rfp-preview' && (
            <motion.div
              key="rfp-preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <RFQPdfPreview rfqDocument={currentChat?.rfpDocument} documentType="RFP" />
            </motion.div>
          )}

          {detailPanelType === 'contract-preview' && (
            <motion.div
              key="contract-preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <RFQPdfPreview rfqDocument={currentChat?.contractDocument} documentType="Contract" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}