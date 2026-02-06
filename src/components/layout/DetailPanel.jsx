import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, ArrowLeft, CheckCircle } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import Button from '../ui/Button'
import VendorTable from '../vendors/VendorTable'
import VendorDetails from '../vendors/VendorDetails'
import RFQForm from '../rfq/RFQForm'
import RFQPreview from '../rfq/RFQPreview'

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
    setPendingChatMessage
  } = useChatStore()

  const [showRfqSuccess, setShowRfqSuccess] = useState(false)

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
  const handleSendRfqFromVendor = (vendor) => {
    const rfqData = currentChat?.rfqData
    const hasRfqDetails = rfqData && (
      rfqData.organizationName || rfqData.requirementSummary || rfqData.procurementType
    )

    if (hasRfqDetails && currentChat?.rfqDocument) {
      // RFQ details are filled AND document is generated - show success
      setShowRfqSuccess(true)

      addMessage(currentChatId, {
        id: `rfq-vendor-sent-${Date.now()}`,
        role: 'assistant',
        content: `RFQ has been submitted to ${vendor.name} successfully.`,
        timestamp: new Date().toISOString(),
        actionType: 'rfq-sent',
        actionComplete: true
      })

      setTimeout(() => setShowRfqSuccess(false), 3000)
    } else {
      // No RFQ details - auto-fill chat with RFQ request
      hideDetailPanel()
      setPendingChatMessage(
        `I want to create an RFQ for ${vendor.name}`
      )
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
      case 'rfq-preview':
        return 'RFQ Document'
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
    if (detailPanelType === 'rfq-preview') {
      return 'Review and edit before sending'
    }
    return null
  }

  const showBackButton = selectedVendor || detailPanelType === 'vendor-details' || detailPanelType === 'rfq-preview'

  const handleBack = () => {
    if (detailPanelType === 'rfq-preview') {
      handleBackToRfqForm()
    } else {
      handleBackFromVendorDetails()
    }
  }

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* RFQ Success Popup */}
      <AnimatePresence>
        {showRfqSuccess && (
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
              className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-accent-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-accent-success" />
              </div>
              <h3 className="font-playfair text-lg font-semibold text-lyzr-congo mb-2">
                RFQ Submitted Successfully
              </h3>
              <p className="text-sm text-lyzr-mid-4">
                Your RFQ has been sent to the selected vendor.
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

          {detailPanelType === 'rfq-preview' && (
            <motion.div
              key="rfq-preview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <RFQPreview rfqDocument={currentChat?.rfqDocument} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}