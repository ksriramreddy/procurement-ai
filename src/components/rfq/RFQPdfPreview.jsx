import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Download, Edit3, Save, X, Eye, FileText, Loader } from 'lucide-react'
import Button from '../ui/Button'
import { useChatStore } from '../../store/chatStore'
import { PDFDocument, rgb } from 'pdf-lib'

export default function RFQPdfPreview({ rfqDocument }) {
  const { currentChat, currentChatId, addMessage, showDetailPanel } = useChatStore()
  
  const [pdfUrl, setPdfUrl] = useState(null)
  const [editableContent, setEditableContent] = useState(rfqDocument || '')
  const [isEditing, setIsEditing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)
  const pdfCanvasRef = useRef(null)

  // Generate PDF from text
  const generatePdf = async (text) => {
    try {
      setIsGenerating(true)
      setError(null)

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create()
      let pages = [pdfDoc.addPage([612, 792])] // Letter size (8.5" x 11")
      const fontSize = 11
      const lineHeight = 14
      const margin = 40
      const maxWidth = 612 - margin * 2

      // Add title to first page
      let currentPageIndex = 0
      let currentPage = pages[currentPageIndex]

      currentPage.drawText('RFQ DOCUMENT', {
        x: margin,
        y: 750,
        size: 16,
        color: rgb(0.4, 0.3, 0.2),
      })

      // Add date
      currentPage.drawText(`Generated: ${new Date().toLocaleDateString()}`, {
        x: margin,
        y: 725,
        size: 9,
        color: rgb(0.5, 0.5, 0.5),
      })

      // Add separator line
      currentPage.drawLine({
        start: { x: margin, y: 715 },
        end: { x: 612 - margin, y: 715 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      })

      // Split text into lines and add to PDF
      const textLines = text.split('\n')
      let yPosition = 695

      for (const line of textLines) {
        // Wrap long lines
        const wrappedLines = wrapText(line || ' ', maxWidth, fontSize)
        
        for (const wrappedLine of wrappedLines) {
          if (yPosition < margin + 30) {
            // Create new page if running out of space
            const newPage = pdfDoc.addPage([612, 792])
            pages.push(newPage)
            currentPageIndex = pages.length - 1
            currentPage = newPage
            yPosition = 750
          }

          currentPage.drawText(wrappedLine, {
            x: margin,
            y: yPosition,
            size: fontSize,
            color: rgb(0.2, 0.2, 0.2),
          })

          yPosition -= lineHeight
        }
      }

      // Save PDF to blob
      const pdfBytes = await pdfDoc.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      
      setPdfUrl(url)
      setIsGenerating(false)
      return blob
    } catch (err) {
      console.error('Failed to generate PDF:', err)
      setError('Failed to generate PDF: ' + err.message)
      setIsGenerating(false)
    }
  }

  // Helper function to wrap text to fit width
  const wrapText = (text, maxWidth, fontSize) => {
    // Rough estimate: each character is about 6 pixels wide at fontSize 11
    const charsPerLine = Math.floor(maxWidth / (fontSize * 0.5))
    const lines = []
    
    for (let i = 0; i < text.length; i += charsPerLine) {
      lines.push(text.substring(i, i + charsPerLine))
    }

    return lines.length > 0 ? lines : [' ']
  }

  // Generate initial PDF on mount
  useEffect(() => {
    if (rfqDocument && !pdfUrl) {
      generatePdf(rfqDocument)
    }
  }, [rfqDocument, pdfUrl])

  // Handle edit toggle
  const handleEditToggle = () => {
    setIsEditing(!isEditing)
  }

  // Handle save changes (regenerate PDF with edited content)
  const handleSaveChanges = async () => {
    setIsGenerating(true)
    await generatePdf(editableContent)
    setIsEditing(false)
  }

  // Handle download PDF
  const handleDownloadPdf = () => {
    if (pdfUrl) {
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `RFQ_${new Date().toISOString().split('T')[0]}.pdf`
      link.click()
    }
  }

  // Handle send RFQ
  const handleSend = async () => {
    setIsSending(true)
    setShowSuccess(true)

    addMessage(currentChatId, {
      id: `rfq-sent-${Date.now()}`,
      role: 'assistant',
      content: 'Your RFQ request has been submitted successfully.',
      timestamp: new Date().toISOString(),
      actionType: 'rfq-sent',
      actionComplete: true
    })

    setIsSending(false)

    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Success Popup Overlay */}
      <AnimatePresence>
        {showSuccess && (
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
              className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full text-center relative"
            >
              <button
                onClick={() => setShowSuccess(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-lyzr-light-2 transition-colors"
              >
                <X className="w-5 h-5 text-lyzr-mid-4" />
              </button>
              <div className="w-16 h-16 bg-accent-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-accent-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-playfair text-lg font-semibold text-lyzr-congo mb-2">
                RFQ Request Submitted
              </h3>
              <p className="text-sm text-lyzr-mid-4">
                Your RFQ has been sent to the selected vendors. You will be notified when responses are received.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RFQ Document */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-lyzr-mid-4" />
            <span className="font-medium text-lyzr-congo">RFQ Document</span>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveChanges}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium 
                    bg-accent-success text-white hover:bg-accent-success/90 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader className="w-3 h-3 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3" />
                  )}
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium 
                    bg-lyzr-light-2 text-lyzr-congo hover:bg-lyzr-cream transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEditToggle}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium 
                    bg-lyzr-light-2 text-lyzr-congo hover:bg-lyzr-cream transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={!pdfUrl}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium 
                    bg-lyzr-light-2 text-lyzr-congo hover:bg-lyzr-cream transition-colors disabled:opacity-50"
                >
                  <Download className="w-3 h-3" />
                  Download PDF
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <p className="text-xs text-lyzr-mid-4 font-medium">Edit RFQ Content</p>
            <textarea
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              className="w-full h-[calc(100%-3rem)] min-h-[400px] px-4 py-3 bg-white border border-lyzr-cream
                rounded-xl text-sm text-lyzr-black leading-relaxed font-mono resize-none
                focus:outline-none focus:ring-2 focus:ring-lyzr-ferra/30 focus:border-lyzr-ferra"
              placeholder="Edit your RFQ document here..."
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white border border-lyzr-cream rounded-xl overflow-hidden flex flex-col"
          >
            {/* PDF Viewer */}
            {isGenerating ? (
              <div className="h-[500px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader className="w-8 h-8 text-lyzr-ferra animate-spin" />
                  <p className="text-sm text-lyzr-mid-4">Generating PDF...</p>
                </div>
              </div>
            ) : pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="RFQ Document Preview"
                className="w-full h-[500px] rounded-lg"
              />
            ) : (
              <div className="h-[500px] flex items-center justify-center text-lyzr-mid-4">
                <p>No PDF available</p>
              </div>
            )}

          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 bg-accent-error/10 border border-accent-error/20 rounded-lg text-xs text-accent-error"
          >
            {error}
          </motion.div>
        )}
      </div>

      {/* Send Button */}
      <div className="p-4 border-t border-lyzr-cream bg-white/80 backdrop-blur-sm">
        <Button
          variant="primary"
          className="w-full"
          onClick={handleSend}
          disabled={showSuccess || isSending || !pdfUrl}
        >
          <Send className="w-4 h-4" />
          {isSending ? 'Sending...' : 'Send RFQ'}
        </Button>
      </div>
    </div>
  )
}
