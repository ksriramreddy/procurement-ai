import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Mail, MessageSquare, Search,
  Globe, Phone, ChevronDown, Loader, RefreshCw,
  FileText, ClipboardList, AlertTriangle, CheckCircle, X
} from 'lucide-react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ThreadChat from './ThreadChat'
import { useChatStore } from '../../store/chatStore'
import { callCertificationAgent } from '../../services/api'
import { fetchAllVendors, fetchVendorThreads, sendDocumentToVendors } from '../../services/backendApi'

export default function VendorPortal() {
  const { currentChat } = useChatStore()

  const [vendors, setVendors] = useState([])
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [threads, setThreads] = useState([])
  const [selectedThread, setSelectedThread] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingThreads, setIsLoadingThreads] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(null) // 'RFQ' | 'RFP' | null
  const [warning, setWarning] = useState(null) // warning message string

  useEffect(() => {
    loadVendors()
  }, [])

  const loadVendors = async () => {
    setIsLoading(true)
    try {
      const data = await fetchAllVendors()
      setVendors(data)
    } catch {
      // backend may be offline
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectVendor = async (vendor) => {
    setSelectedVendor(vendor)
    setSelectedThread(null)
    setIsLoadingThreads(true)
    try {
      const data = await fetchVendorThreads(vendor.vendor_id)
      setThreads(data)
      if (data.length > 0) {
        setSelectedThread(data[0])
      }
    } catch {
      setThreads([])
    } finally {
      setIsLoadingThreads(false)
    }
  }

  const handleSelectThread = (thread) => {
    setSelectedThread(thread)
  }

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

  const handleSendDocument = async (docType) => {
    // Check if document is generated
    if (docType === 'RFQ' && !currentChat?.rfqDocument) {
      setWarning('RFQ document has not been generated yet. Please generate the RFQ first from the chat.')
      return
    }
    if (docType === 'RFP' && !currentChat?.rfpDocument) {
      setWarning('RFP document has not been generated yet. Please generate the RFP first from the chat.')
      return
    }

    if (!selectedVendor) return

    setIsSending(true)
    setWarning(null)

    // Build vendor payload from the selected backend vendor record
    const vendor = {
      website: selectedVendor.website || selectedVendor.vendor_id || '',
      name: selectedVendor.vendor_name || '',
      contact: {
        email: selectedVendor.contact_email || '',
        name: selectedVendor.contact_name || ''
      },
      type: selectedVendor.vendor_type || '',
      headquarters: selectedVendor.headquarters || '',
    }

    // Determine subject & price based on doc type
    let subject = ''
    let quotedPrice = null
    let certInput = null

    if (docType === 'RFQ') {
      const rfq = currentChat?.rfqData
      subject = rfq?.requirementSummary || rfq?.procurementType || 'RFQ Request'
      quotedPrice = parseBudgetToInt(rfq?.budgetRange)
      if (rfq) {
        certInput = {
          rfq_id: rfq.rfqId || '',
          organization_name: rfq.organizationName || '',
          contact_name: rfq.contactName || '',
          contact_email: rfq.contactEmail || '',
          procurement_type: rfq.procurementType || '',
          requirement_summary: rfq.requirementSummary || '',
          quantity: rfq.quantity || '',
          delivery_timeline: rfq.deliveryTimeline || '',
          budget_range: rfq.budgetRange || '',
          response_deadline: rfq.responseDeadline || '',
          additional_fields: rfq.additionalFields || []
        }
      }
    } else {
      const rfp = currentChat?.rfpData
      subject = rfp?.projectTitle || 'RFP Request'
      quotedPrice = parseBudgetToInt(rfp?.budget)
      if (rfp) {
        certInput = {
          organization_name: rfp.issuedBy || '',
          contact_name: '',
          contact_email: '',
          procurement_type: 'Services',
          requirement_summary: rfp.projectTitle || '',
          quantity: '',
          delivery_timeline: rfp.submissionDeadline || '',
          budget_range: rfp.budget || '',
          response_deadline: rfp.submissionDeadline || '',
          additional_fields: []
        }
      }
    }

    // Step 1: Call certification agent
    let certificationData = { mandatory: [], good_to_have: [], summary: '' }
    if (certInput) {
      try {
        certificationData = await callCertificationAgent(certInput, currentChat?.sessionId)
      } catch (err) {
        console.warn('[VendorPortal] certification agent failed:', err.message)
      }
    }

    // Step 2: Send to backend
    try {
      await sendDocumentToVendors({
        vendors: [vendor],
        documentType: docType,
        subject,
        quotedPrice,
        documentContent: docType === 'RFQ' ? currentChat?.rfqDocument : currentChat?.rfpDocument,
        certificationData
      })
      setSendSuccess(docType)
      // Reload threads for this vendor
      const data = await fetchVendorThreads(selectedVendor.vendor_id)
      setThreads(data)
      if (data.length > 0) setSelectedThread(data[0])
      setTimeout(() => setSendSuccess(null), 3000)
    } catch (err) {
      console.warn('[VendorPortal] sendDocumentToVendors failed:', err.message)
    } finally {
      setIsSending(false)
    }
  }

  const filteredVendors = useMemo(() => {
    if (!searchQuery.trim()) return vendors
    return vendors.filter(v =>
      v.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vendor_id?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [vendors, searchQuery])

  return (
    <div className="flex-1 flex flex-col h-full bg-lyzr-white-amber overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-lyzr-cream bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-playfair text-xl font-semibold text-lyzr-congo">
              Vendor Portal
            </h1>
            <p className="text-sm text-lyzr-mid-4 mt-0.5">
              Manage vendor communications and track requirements
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="info">
              {vendors.length} vendor{vendors.length !== 1 ? 's' : ''}
            </Badge>
            <button
              onClick={loadVendors}
              className="p-2 hover:bg-lyzr-light-2 rounded-lg transition-colors"
              title="Refresh vendors"
            >
              <RefreshCw className={`w-4 h-4 text-lyzr-mid-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Vendor list */}
        <div className="w-80 border-r border-lyzr-cream bg-white flex flex-col flex-shrink-0">
          {/* Search */}
          <div className="p-3 border-b border-lyzr-cream">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lyzr-mid-4" />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-lyzr-light-1 border border-transparent rounded-lg text-sm
                  placeholder-lyzr-mid-4 focus:outline-none focus:border-lyzr-cream"
              />
            </div>
          </div>

          {/* Vendor list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 text-lyzr-ferra animate-spin" />
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Building2 className="w-10 h-10 text-lyzr-mid-4 mx-auto mb-3" />
                <p className="text-sm text-lyzr-mid-4">
                  {searchQuery ? 'No vendors match your search' : 'No vendors yet. Send an RFQ or RFP to get started.'}
                </p>
              </div>
            ) : (
              filteredVendors.map((vendor, index) => (
                <motion.button
                  key={vendor.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleSelectVendor(vendor)}
                  className={`w-full px-4 py-3 text-left border-b border-lyzr-light-2
                    transition-colors hover:bg-lyzr-light-1
                    ${selectedVendor?.id === vendor.id ? 'bg-lyzr-cream' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
                      ${selectedVendor?.id === vendor.id ? 'bg-lyzr-ferra/20' : 'bg-lyzr-light-2'}`}>
                      <Building2 className={`w-4 h-4 ${selectedVendor?.id === vendor.id ? 'text-lyzr-ferra' : 'text-lyzr-mid-4'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-lyzr-congo truncate">
                        {vendor.vendor_name}
                      </p>
                      <p className="text-xs text-lyzr-mid-4 truncate">
                        {vendor.contact_email || vendor.vendor_id}
                      </p>
                    </div>
                    <Badge variant={vendor.source === 'external' ? 'warning' : 'success'} size="sm">
                      {vendor.source}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 ml-12">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-lyzr-mid-4" />
                      <span className="text-xs text-lyzr-mid-4">
                        {vendor.thread_ids?.length || 0} thread{(vendor.thread_ids?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {vendor.technical_compliance_status && (
                      <Badge variant="success" size="sm">Compliant</Badge>
                    )}
                  </div>
                </motion.button>
              ))
            )}
          </div>
        </div>

        {/* Right: Vendor details + threads */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedVendor ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Building2 className="w-12 h-12 text-lyzr-cream mx-auto mb-3" />
                <p className="text-lyzr-congo font-medium">Select a vendor</p>
                <p className="text-sm text-lyzr-mid-4 mt-1">Choose a vendor to view their threads and details</p>
              </div>
            </div>
          ) : (
            <>
              {/* Vendor header */}
              <div className="px-6 py-4 border-b border-lyzr-cream bg-white">
                <div>
                  <h2 className="font-playfair text-lg font-semibold text-lyzr-congo">
                    {selectedVendor.vendor_name}
                  </h2>
                  <div className="flex items-center gap-4 mt-2 text-sm text-lyzr-mid-4">
                    {selectedVendor.contact_email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{selectedVendor.contact_email}</span>
                      </div>
                    )}
                    {selectedVendor.headquarters && (
                      <div className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        <span>{selectedVendor.headquarters}</span>
                      </div>
                    )}
                    {selectedVendor.contact_name && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{selectedVendor.contact_name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Warning banner */}
                <AnimatePresence>
                  {warning && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <div className="flex items-center gap-2 px-3 py-2 bg-accent-warning/10 border border-accent-warning/20 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-accent-warning flex-shrink-0" />
                        <p className="text-xs text-accent-warning flex-1">{warning}</p>
                        <button onClick={() => setWarning(null)} className="p-0.5 hover:bg-accent-warning/10 rounded">
                          <X className="w-3.5 h-3.5 text-accent-warning" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Send success banner */}
                <AnimatePresence>
                  {sendSuccess && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <div className="flex items-center gap-2 px-3 py-2 bg-accent-success/10 border border-accent-success/20 rounded-lg">
                        <CheckCircle className="w-4 h-4 text-accent-success flex-shrink-0" />
                        <p className="text-xs text-accent-success">
                          {sendSuccess} sent to {selectedVendor.vendor_name} successfully. Thread created.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Thread selector */}
                {isLoadingThreads ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-lyzr-mid-4">
                    <Loader className="w-4 h-4 animate-spin" />
                    Loading threads...
                  </div>
                ) : threads.length > 0 ? (
                  <div className="mt-3">
                    <label className="text-xs font-medium text-lyzr-mid-4 uppercase tracking-wider mb-1.5 block">
                      Select Thread ({threads.length})
                    </label>
                    <div className="relative">
                      <select
                        value={selectedThread?.id || ''}
                        onChange={(e) => {
                          const thread = threads.find(t => t.id === e.target.value)
                          if (thread) handleSelectThread(thread)
                        }}
                        className="w-full px-4 py-2.5 bg-white border border-lyzr-cream rounded-lg text-sm
                          text-lyzr-black focus:outline-none focus:ring-2 focus:ring-lyzr-ferra/30 appearance-none pr-10"
                      >
                        {threads.map(thread => (
                          <option key={thread.id} value={thread.id}>
                            {thread.subject} {thread.document_type ? `(${thread.document_type})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lyzr-mid-4 pointer-events-none" />
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-lyzr-mid-4">No threads found for this vendor.</p>
                )}
              </div>

              {/* Thread chat content */}
              <div className="flex-1 overflow-hidden">
                {selectedThread ? (
                  <ThreadChat
                    key={selectedThread.id}
                    thread={selectedThread}
                    vendorName={selectedVendor.vendor_name}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-lyzr-mid-4">Select a thread to view details</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
