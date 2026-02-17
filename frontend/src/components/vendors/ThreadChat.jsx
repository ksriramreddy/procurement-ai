import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Upload, CheckCircle, XCircle, FileText, Shield, ShieldCheck,
  AlertCircle, Loader, Info, Download, ExternalLink, Scale, Edit3
} from 'lucide-react'
import Badge from '../ui/Badge'
import { fetchThreadMessages, createMessage, updateCertStatus } from '../../services/backendApi'
import { callOcrAgent, callCertVerifierAgent, callNegotiationAgent, fetchNegotiationHistory } from '../../services/api'

export default function ThreadChat({ thread, vendorName }) {
  const [messages, setMessages] = useState([])
  const [negotiationMessages, setNegotiationMessages] = useState([])  // from session history API
  const [liveNegotiationMessages, setLiveNegotiationMessages] = useState([])  // temp: current session
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isNegotiating, setIsNegotiating] = useState(false)
  const [customerEditId, setCustomerEditId] = useState(null)  // which msg is being edited
  const [customerEditText, setCustomerEditText] = useState('')
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false)
  // Track uploaded files per cert:
  // { 'ISO IEC 27001': { filename, uploading, score, error, badQuality, verifying, verification } }
  const [certUploads, setCertUploads] = useState({})
  const messagesEndRef = useRef(null)
  const fileInputRefs = useRef({})

  // Helper: get cert name from string or object format
  const getCertName = (cert) => typeof cert === 'string' ? cert : cert.certificate

  // Parse negotiation session history into chat-friendly format
  // vendor_message → right side (vendor), customer_message → skip (already shown in agent response)
  const parseNegotiationHistory = (history) => {
    const result = []

    for (let i = 0; i < history.length; i++) {
      const entry = history[i]

      if (entry.role === 'assistant') {
        let content = entry.content
        let flag = 0
        try {
          const parsed = JSON.parse(entry.content)
          content = parsed.content || entry.content
          flag = parsed.flag ?? 0
        } catch { /* use raw content */ }

        result.push({
          id: `neg-assistant-${i}-${entry.created_at}`,
          message: content,
          sender: 'negotiator',
          flag,
          created_at: entry.created_at
        })
      } else {
        // User message — check if it's vendor_message or customer_message
        let parsed = null
        try {
          parsed = JSON.parse(entry.content)
        } catch { /* not JSON */ }

        if (parsed?.customer_message) {
          // Customer edit — skip, don't display
          continue
        }

        const content = parsed?.vendor_message || entry.content
        result.push({
          id: `neg-user-${i}-${entry.created_at}`,
          message: content,
          sender: 'vendor',
          created_at: entry.created_at
        })
      }
    }

    return result
  }

  // Load messages + negotiation history when thread changes (clear live messages)
  useEffect(() => {
    if (thread?.thread_id) {
      setLiveNegotiationMessages([])
      loadMessages()
      loadNegotiationHistory()

      // Pre-populate certUploads from is_submitted values
      const initial = {}
      ;[...(thread.mandatory || []), ...(thread.good_to_have || [])].forEach(cert => {
        const name = getCertName(cert)
        const status = typeof cert === 'object' ? cert.is_submitted : ''
        if (status) {
          initial[name] = {
            filename: '', uploading: false, score: null, error: false,
            badQuality: false, verifying: false,
            verification: { validation_status: status, reason: '', confidence_score: null }
          }
        }
      })
      setCertUploads(initial)
    }
  }, [thread?.thread_id])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, negotiationMessages, liveNegotiationMessages, certUploads, isNegotiating])

  const loadMessages = async () => {
    setIsLoadingMessages(true)
    try {
      const data = await fetchThreadMessages(thread.thread_id)
      setMessages(data)
    } catch {
      setMessages([])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const loadNegotiationHistory = async () => {
    try {
      const history = await fetchNegotiationHistory(thread.thread_id)
      setNegotiationMessages(parseNegotiationHistory(history))
    } catch {
      setNegotiationMessages([])
    }
  }

  // Submit edited negotiation text (flag=1 override)
  const handleSubmitEdit = async (msgId) => {
    const text = customerEditText.trim()
    if (!text || isSubmittingEdit) return

    setIsSubmittingEdit(true)
    try {
      const result = await callNegotiationAgent({
        customerSummary: thread.summary || thread.subject || '',
        customerMessage: text,
        threadId: thread.thread_id
      })

      // Remove the flag from the original message (mark as handled)
      const clearFlag = (msgs) => msgs.map(m =>
        m.id === msgId ? { ...m, flag: 0 } : m
      )
      setNegotiationMessages(clearFlag)
      setLiveNegotiationMessages(clearFlag)

      if (result?.content) {
        const newId = `neg-assistant-live-${Date.now()}`
        setLiveNegotiationMessages(prev => [
          ...prev,
          {
            id: newId,
            message: result.content,
            sender: 'negotiator',
            flag: result.flag ?? 0,
            created_at: new Date().toISOString()
          }
        ])
        if (result.flag === 1) {
          setCustomerEditId(newId)
          setCustomerEditText(result.content)
        } else {
          setCustomerEditId(null)
          setCustomerEditText('')
        }
      } else {
        setCustomerEditId(null)
        setCustomerEditText('')
      }
    } catch (err) {
      console.warn('[ThreadChat] edit submission failed:', err.message)
    } finally {
      setIsSubmittingEdit(false)
    }
  }

  const handleSendMessage = async () => {
    const text = inputValue.trim()
    if (!text || isSending) return

    setIsSending(true)
    setInputValue('')
    try {
      const newMsg = await createMessage({
        message: text,
        threadId: thread.thread_id,
        sender: 'vendor'
      })
      setMessages(prev => [...prev, newMsg])
      setIsSending(false)

      // Call negotiation agent and show response
      setIsNegotiating(true)
      try {
        const result = await callNegotiationAgent({
          customerSummary: thread.summary || thread.subject || '',
          vendorMessage: text,
          threadId: thread.thread_id
        })

        if (result?.content) {
          const assistantId = `neg-assistant-live-${Date.now()}`
          setLiveNegotiationMessages(prev => [
            ...prev,
            {
              id: `neg-user-live-${Date.now()}`,
              message: text,
              sender: 'vendor',
              created_at: new Date().toISOString()
            },
            {
              id: assistantId,
              message: result.content,
              sender: 'negotiator',
              flag: result.flag ?? 0,
              created_at: new Date().toISOString()
            }
          ])
          // If flag=1, auto-open the edit input for this message
          if (result.flag === 1) {
            setCustomerEditId(assistantId)
            setCustomerEditText(result.content)
          }
        }
      } catch (err) {
        console.warn('[ThreadChat] negotiation agent failed:', err.message)
      } finally {
        setIsNegotiating(false)
      }
    } catch (err) {
      console.warn('[ThreadChat] send message failed:', err.message)
      setIsSending(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleCertUpload = async (certName, file, field) => {
    // Generate a unique session ID per upload (not the thread ID)
    const sessionId = `VERIFY-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`

    // Step 1: OCR scan
    setCertUploads(prev => ({
      ...prev,
      [certName]: { filename: file.name, uploading: true, score: null, error: false, badQuality: false, verifying: false, verification: null }
    }))

    try {
      const ocrResult = await callOcrAgent(certName, file, sessionId)
      const score = ocrResult.ocr_quality_score

      if (score !== null && score < 60) {
        // Bad quality — stop here
        setCertUploads(prev => ({
          ...prev,
          [certName]: { ...prev[certName], uploading: false, score, badQuality: true }
        }))

        await createMessage({
          message: `Uploaded ${certName} — OCR quality score: ${score} (bad quality, re-upload needed)`,
          threadId: thread.thread_id,
          sender: 'vendor'
        }).then(msg => setMessages(prev => [...prev, msg])).catch(() => {})
        return
      }

      // Step 2: OCR passed — now verify certificate
      setCertUploads(prev => ({
        ...prev,
        [certName]: { ...prev[certName], uploading: false, score, verifying: true }
      }))

      try {
        const verifyResult = await callCertVerifierAgent(ocrResult, sessionId)

        setCertUploads(prev => ({
          ...prev,
          [certName]: { ...prev[certName], verifying: false, verification: verifyResult }
        }))

        const statusLabel = verifyResult.validation_status === 'VALID' ? 'Valid'
          : verifyResult.validation_status === 'NOT_VALID' ? 'Not Valid'
          : 'Unable to Verify'

        await createMessage({
          message: `${certName} — OCR: ${score} | Verification: ${statusLabel}${verifyResult.reason ? ` — ${verifyResult.reason}` : ''}`,
          threadId: thread.thread_id,
          sender: 'vendor'
        }).then(msg => setMessages(prev => [...prev, msg])).catch(() => {})

        // Step 3: Update thread in MongoDB with verification status
        await updateCertStatus({
          threadId: thread.thread_id,
          certificate: certName,
          field,
          isSubmitted: verifyResult.validation_status
        }).catch(err => console.warn('[ThreadChat] cert status update failed:', err.message))
      } catch (verifyErr) {
        console.warn('[ThreadChat] cert verification failed:', verifyErr.message)
        setCertUploads(prev => ({
          ...prev,
          [certName]: { ...prev[certName], verifying: false, verification: { validation_status: 'UNABLE_TO_VERIFY', reason: 'Verification service error', confidence_score: null } }
        }))
      }
    } catch (err) {
      console.warn('[ThreadChat] OCR upload failed:', err.message)
      setCertUploads(prev => ({
        ...prev,
        [certName]: { filename: file.name, uploading: false, score: null, error: true, badQuality: false, verifying: false, verification: null }
      }))
    }
  }

  const triggerFileInput = (certName) => {
    fileInputRefs.current[certName]?.click()
  }

  const getDocTypeBadge = (type) => {
    switch (type) {
      case 'RFQ': return 'info'
      case 'RFP': return 'warning'
      case 'Contract': return 'success'
      default: return 'default'
    }
  }

  // Render cert upload status — icon-only with tooltip on hover
  const renderCertStatus = (upload, refKey) => {
    if (!upload) {
      return (
        <button
          onClick={() => triggerFileInput(refKey)}
          title="Upload certificate"
          className="p-1 rounded-md text-lyzr-ferra hover:bg-lyzr-cream transition-colors flex-shrink-0"
        >
          <Upload className="w-4 h-4" />
        </button>
      )
    }

    // OCR scanning
    if (upload.uploading) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          title="Scanning document..."
          className="p-1 flex-shrink-0"
        >
          <Loader className="w-4 h-4 animate-spin text-amber-500" />
        </motion.div>
      )
    }

    // Error
    if (upload.error) {
      return (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => triggerFileInput(refKey)}
          title="Upload failed — click to retry"
          className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
        >
          <AlertCircle className="w-4 h-4" />
        </motion.button>
      )
    }

    // Bad OCR quality
    if (upload.badQuality) {
      return (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => triggerFileInput(refKey)}
          title={`Bad image quality (score: ${upload.score}) — click to re-upload`}
          className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
        >
          <XCircle className="w-4 h-4" />
        </motion.button>
      )
    }

    // Verifying certificate
    if (upload.verifying) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          title="Verifying certificate..."
          className="p-1 flex-shrink-0"
        >
          <Loader className="w-4 h-4 animate-spin text-blue-500" />
        </motion.div>
      )
    }

    // Verification complete
    if (upload.verification) {
      const { validation_status, reason } = upload.verification
      const canReupload = validation_status !== 'VALID'

      if (validation_status === 'VALID') {
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            title={reason || 'Certificate is valid'}
            className="p-1 flex-shrink-0"
          >
            <CheckCircle className="w-4 h-4 text-green-500" />
          </motion.div>
        )
      }

      if (validation_status === 'NOT_VALID') {
        return (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => triggerFileInput(refKey)}
            title={reason || 'Certificate is not valid — click to upload another'}
            className="p-1 rounded-md text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
          >
            <XCircle className="w-4 h-4" />
          </motion.button>
        )
      }

      // UNABLE_TO_VERIFY
      return (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => triggerFileInput(refKey)}
          title={reason || 'Unable to verify — click to upload another'}
          className="p-1 rounded-md text-amber-500 hover:bg-amber-50 transition-colors flex-shrink-0"
        >
          <Info className="w-4 h-4" />
        </motion.button>
      )
    }

    // Fallback
    return (
      <div title={`OCR score: ${upload.score}`} className="p-1 flex-shrink-0">
        <CheckCircle className="w-4 h-4 text-green-500" />
      </div>
    )
  }

  if (!thread) return null

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable chat area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Customer message: Requirement Summary */}
        <div className="flex justify-start">
          <div className="flex gap-3 max-w-[85%]">
            <img src="/image.png" alt="Lyzr" className="w-8 h-8 rounded-full object-contain flex-shrink-0" />
            <div className="flex flex-col items-start">
              <span className="text-xs text-lyzr-mid-4 mb-1 ml-1">Customer</span>
              <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white border border-lyzr-cream text-lyzr-congo">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {thread.summary || thread.subject}
                </p>
                {thread.document_type && (
                  <div className="mt-2">
                    <Badge variant={getDocTypeBadge(thread.document_type)} size="sm">
                      {thread.document_type}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer message: Mandatory Certifications */}
        {thread.mandatory?.length > 0 && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-lyzr-black flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-lyzr-white-amber" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs text-lyzr-mid-4 mb-1 ml-1">Customer</span>
                <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white border border-lyzr-cream text-lyzr-congo w-full">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-accent-error" />
                    <span className="text-sm font-semibold text-lyzr-congo">Mandatory Certifications</span>
                  </div>
                  <div className="space-y-2">
                    {thread.mandatory.map((certItem) => {
                      const certName = getCertName(certItem)
                      const upload = certUploads[certName]
                      return (
                        <div key={certName} className="flex items-center gap-2 group">
                          <span className="text-xs font-medium text-lyzr-congo flex-1 min-w-0 truncate">
                            {certName}
                          </span>

                          {/* Hidden file input */}
                          <input
                            type="file"
                            className="hidden"
                            ref={el => fileInputRefs.current[certName] = el}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleCertUpload(certName, file, 'mandatory')
                              e.target.value = ''
                            }}
                          />

                          {renderCertStatus(upload, certName)}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer message: Good to Have Certifications */}
        {thread.good_to_have?.length > 0 && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-full bg-lyzr-black flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-lyzr-white-amber" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs text-lyzr-mid-4 mb-1 ml-1">Customer</span>
                <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white border border-lyzr-cream text-lyzr-congo w-full">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-accent-cool" />
                    <span className="text-sm font-semibold text-lyzr-congo">Good to Have Certifications</span>
                  </div>
                  <div className="space-y-2">
                    {thread.good_to_have.map((certItem) => {
                      const certName = getCertName(certItem)
                      const upload = certUploads[certName]
                      return (
                        <div key={certName} className="flex items-center gap-2 group">
                          <span className="text-xs font-medium text-lyzr-congo flex-1 min-w-0 truncate">
                            {certName}
                          </span>

                          <input
                            type="file"
                            className="hidden"
                            ref={el => fileInputRefs.current[`gth_${certName}`] = el}
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleCertUpload(certName, file, 'good_to_have')
                              e.target.value = ''
                            }}
                          />

                          {renderCertStatus(upload, `gth_${certName}`)}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading indicator for messages */}
        {isLoadingMessages && (
          <div className="flex justify-center py-4">
            <Loader className="w-5 h-5 text-lyzr-ferra animate-spin" />
          </div>
        )}

        {/* Existing messages from DB */}
        <AnimatePresence>
          {messages.map((msg, index) => {
            const isVendor = msg.sender === 'vendor'
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`flex ${isVendor ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${isVendor ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${isVendor ? 'bg-lyzr-ferra' : 'bg-lyzr-black'}`}
                  >
                    {isVendor ? (
                      <FileText className="w-4 h-4 text-white" />
                    ) : (
                      <img src="/image.png" alt="Lyzr" className="w-5 h-5 rounded object-contain" />
                    )}
                  </div>

                  <div className={`flex flex-col ${isVendor ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-lyzr-mid-4 mb-1 mx-1">
                      {isVendor ? vendorName || 'Vendor' : 'Customer'}
                    </span>
                    <div className={`px-4 py-3 rounded-2xl
                      ${isVendor
                        ? 'bg-lyzr-ferra text-white rounded-tr-md'
                        : 'bg-white border border-lyzr-cream text-lyzr-congo rounded-tl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.message}
                      </p>
                      {msg.attachment?.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {msg.attachment.map((url, i) => {
                            const isS3 = url.startsWith('http')
                            const href = isS3 ? url : `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}${url}`
                            const fileName = isS3 ? decodeURIComponent(url.split('/').pop()) : 'Attachment'
                            return (
                              <div
                                key={i}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl
                                  ${isVendor ? 'bg-white/10' : 'bg-lyzr-light-1 border border-lyzr-cream'}`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                                  ${isVendor ? 'bg-white/20' : 'bg-lyzr-ferra/10'}`}>
                                  <FileText className={`w-4 h-4 ${isVendor ? 'text-white' : 'text-lyzr-ferra'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-medium truncate ${isVendor ? 'text-white' : 'text-lyzr-congo'}`}>
                                    {fileName}
                                  </p>
                                  <p className={`text-[10px] ${isVendor ? 'text-white/60' : 'text-lyzr-mid-4'}`}>
                                    {msg.message}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="View"
                                    className={`p-1.5 rounded-lg transition-colors
                                      ${isVendor ? 'hover:bg-white/20 text-white' : 'hover:bg-lyzr-cream text-lyzr-congo'}`}
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                  <a
                                    href={href}
                                    download={fileName}
                                    title="Download"
                                    className={`p-1.5 rounded-lg transition-colors
                                      ${isVendor ? 'hover:bg-white/20 text-white' : 'hover:bg-lyzr-cream text-lyzr-congo'}`}
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Negotiation messages: history (from API) + live (temp from current session) */}
        <AnimatePresence>
          {[...negotiationMessages, ...liveNegotiationMessages].map((msg, index) => {
            const isVendor = msg.sender === 'vendor'
            const isEdit = msg.sender === 'negotiator-edit'
            const isNegotiator = msg.sender === 'negotiator' || isEdit
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`flex ${isVendor ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${isVendor ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                    ${isVendor ? 'bg-lyzr-ferra' : isEdit ? 'bg-lyzr-ferra/70' : 'bg-lyzr-congo'}`}
                  >
                    {isVendor ? (
                      <FileText className="w-4 h-4 text-white" />
                    ) : isEdit ? (
                      <Edit3 className="w-4 h-4 text-white" />
                    ) : (
                      <Scale className="w-4 h-4 text-lyzr-white-amber" />
                    )}
                  </div>
                  <div className={`flex flex-col ${isVendor ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-lyzr-mid-4 mb-1 mx-1">
                      {isVendor ? vendorName || 'Vendor' : isEdit ? 'Customer Edit' : 'Negotiation Agent'}
                    </span>
                    <div className={`px-4 py-3 rounded-2xl
                      ${isVendor
                        ? 'bg-lyzr-ferra text-white rounded-tr-md'
                        : isEdit
                          ? 'bg-lyzr-ferra/10 border border-lyzr-ferra/20 text-lyzr-congo rounded-tl-md'
                          : 'bg-lyzr-congo/5 border border-lyzr-congo/20 text-lyzr-congo rounded-tl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.message}
                      </p>
                    </div>

                    {/* Flag=1: editable input for customer to modify agent's response */}
                    {isNegotiator && !isEdit && msg.flag === 1 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 w-full"
                      >
                        <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Edit3 className="w-3 h-3 text-amber-600" />
                            <span className="text-[10px] font-medium text-amber-700">Review required — edit and submit</span>
                          </div>
                          <textarea
                            value={customerEditId === msg.id ? customerEditText : msg.message}
                            onChange={(e) => {
                              setCustomerEditId(msg.id)
                              setCustomerEditText(e.target.value)
                            }}
                            onFocus={() => {
                              if (customerEditId !== msg.id) {
                                setCustomerEditId(msg.id)
                                setCustomerEditText(msg.message)
                              }
                            }}
                            rows={3}
                            className="w-full text-xs text-lyzr-congo bg-white border border-amber-200 rounded-lg px-3 py-2
                              focus:outline-none focus:border-amber-400 resize-y"
                          />
                          <div className="flex justify-end mt-1.5">
                            <button
                              onClick={() => handleSubmitEdit(msg.id)}
                              disabled={isSubmittingEdit}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-lyzr-congo text-white text-xs
                                font-medium rounded-lg hover:bg-lyzr-ferra transition-colors
                                disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {isSubmittingEdit ? (
                                <Loader className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              Submit
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {/* Typing indicator while negotiation agent is processing */}
        {isNegotiating && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-lyzr-congo flex items-center justify-center flex-shrink-0">
                <Scale className="w-4 h-4 text-lyzr-white-amber" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-xs text-lyzr-mid-4 mb-1 mx-1">Negotiation Agent</span>
                <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-lyzr-congo/5 border border-lyzr-congo/20">
                  <div className="flex items-center gap-1.5">
                    <motion.span
                      className="w-2 h-2 bg-lyzr-congo/60 rounded-full"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                    />
                    <motion.span
                      className="w-2 h-2 bg-lyzr-congo/60 rounded-full"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }}
                    />
                    <motion.span
                      className="w-2 h-2 bg-lyzr-congo/60 rounded-full"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message input bar */}
      <div className="px-4 py-3 border-t border-lyzr-cream bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-lyzr-light-1 border border-transparent rounded-xl text-sm
              placeholder-lyzr-mid-4 focus:outline-none focus:border-lyzr-cream focus:bg-white transition-colors"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSending}
            className="p-2.5 bg-lyzr-ferra text-white rounded-xl hover:bg-lyzr-congo transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isSending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
