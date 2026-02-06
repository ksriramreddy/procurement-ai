import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Plus } from 'lucide-react'
import { useChatStore } from '../../store/chatStore'

export default function ChatInput({
  onSend,
  disabled = false,
  placeholder = 'Type a message...'
}) {
  const [message, setMessage] = useState('')
  const textareaRef = useRef(null)
  const { pendingChatMessage, setPendingChatMessage } = useChatStore()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [message])

  // Pick up pending chat message from store (e.g. from vendor "Send RFQ" button)
  useEffect(() => {
    if (pendingChatMessage) {
      setMessage(pendingChatMessage)
      setPendingChatMessage(null)
      // Focus the textarea
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }, [pendingChatMessage, setPendingChatMessage])

  const handleSubmit = (e) => {
    e?.preventDefault()
    if (message.trim() && !disabled) {
      onSend(message)
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end gap-2 bg-white rounded-2xl border border-lyzr-cream p-2 shadow-sm
        focus-within:border-lyzr-mid-1 focus-within:shadow-md transition-all duration-200">
        {/* Add Button (for future file attachments) */}
        <button
          type="button"
          className="p-2 text-lyzr-mid-4 hover:text-lyzr-congo hover:bg-lyzr-light-2 rounded-lg
            transition-colors duration-200"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 resize-none bg-transparent text-lyzr-black placeholder-lyzr-mid-4
            text-sm py-2 px-1 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
            max-h-[200px]"
        />

        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={!message.trim() || disabled}
          whileHover={{ scale: message.trim() && !disabled ? 1.05 : 1 }}
          whileTap={{ scale: message.trim() && !disabled ? 0.95 : 1 }}
          className={`
            p-2.5 rounded-xl transition-all duration-200
            ${message.trim() && !disabled
              ? 'bg-lyzr-ferra text-white hover:bg-lyzr-congo'
              : 'bg-lyzr-light-2 text-lyzr-mid-4 cursor-not-allowed'
            }
          `}
        >
          {disabled ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </motion.button>
      </div>
    </form>
  )
}