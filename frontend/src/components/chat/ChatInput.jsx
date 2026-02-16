import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Plus, X, FileIcon, Loader } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'
import { uploadAsset } from '../../services/api'

export default function ChatInput({
  onSend,
  onFileUploaded,
  disabled = false,
  placeholder = 'Type a message...'
}) {
  const [message, setMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)
  const { pendingChatMessage, setPendingChatMessage } = useChatStore()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [message])

  // Pick up pending chat message from store (e.g. from vendor "Send RFQ" button)
  // Supports string (fill only) or { message, autoSend } (fill + auto-submit)
  useEffect(() => {
    if (pendingChatMessage) {
      const isObject = typeof pendingChatMessage === 'object'
      const text = isObject ? pendingChatMessage.message : pendingChatMessage
      const autoSend = isObject ? pendingChatMessage.autoSend : false

      setMessage(text)
      setPendingChatMessage(null)

      if (autoSend && text?.trim() && !disabled) {
        // Small delay to let state settle, then auto-submit
        setTimeout(() => {
          onSend(text)
          setMessage('')
        }, 150)
      } else {
        setTimeout(() => textareaRef.current?.focus(), 100)
      }
    }
  }, [pendingChatMessage, setPendingChatMessage, onSend, disabled])

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (message.trim() && !disabled && !isUploading) {
      onSend(message, selectedFile?.assetId)
      setMessage('')
      setSelectedFile(null)
      setUploadError(null)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    setIsUploading(true)

    try {
      const assetId = await uploadAsset(file)
      setSelectedFile({
        name: file.name,
        size: file.size,
        assetId
      })
      
      // Call the onFileUploaded callback if provided
      if (onFileUploaded) {
        onFileUploaded({
          name: file.name,
          size: file.size,
          type: file.type,
          assetId
        })
      }
    } catch (error) {
      setUploadError(error.message || 'Failed to upload file')
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadError(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* File Upload Input (Hidden) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.pptx,.docx,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {/* File Preview */}
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg"
        >
          <FileIcon className="w-4 h-4 text-green-600" />
          <span className="flex-1 text-sm text-green-700">
            📎 {selectedFile.name}
          </span>
          <button
            type="button"
            onClick={handleRemoveFile}
            disabled={isUploading}
            className="p-1 hover:bg-green-100 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-green-600" />
          </button>
        </motion.div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg"
        >
          <span className="text-sm text-red-700">{uploadError}</span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="ml-auto p-1 hover:bg-red-100 rounded transition-colors"
          >
            <X className="w-4 h-4 text-red-600" />
          </button>
        </motion.div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-end gap-2 bg-white rounded-2xl border border-lyzr-cream p-2 shadow-sm
          focus-within:border-lyzr-mid-1 focus-within:shadow-md transition-all duration-200">
          {/* File Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            title="Attach file (PDF, PPTX, DOCX, JPG, PNG)"
            className="p-2 text-lyzr-mid-4 hover:text-lyzr-congo hover:bg-lyzr-light-2 rounded-lg
              transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isUploading}
            placeholder={placeholder}
            rows={1}
            className="flex-1 resize-none bg-transparent text-lyzr-black placeholder-lyzr-mid-4
              text-sm py-2 px-1 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
              max-h-[200px]"
          />

          {/* Send Button */}
          <motion.button
            type="submit"
            disabled={!message.trim() || disabled || isUploading}
            whileHover={{ scale: message.trim() && !disabled && !isUploading ? 1.05 : 1 }}
            whileTap={{ scale: message.trim() && !disabled && !isUploading ? 0.95 : 1 }}
            className={`
              p-2.5 rounded-xl transition-all duration-200
              ${message.trim() && !disabled && !isUploading
                ? 'bg-lyzr-ferra text-white hover:bg-lyzr-congo'
                : 'bg-lyzr-light-2 text-lyzr-mid-4 cursor-not-allowed'
              }
            `}
          >
            {disabled || isUploading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </form>
    </div>
  )
}