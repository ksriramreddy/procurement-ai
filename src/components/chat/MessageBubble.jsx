import { motion } from 'framer-motion'
import { User, Bot, AlertCircle, FileIcon, Download } from 'lucide-react'
import Badge from '../ui/Badge'
import ActionCard from './ActionCard'
import { useChatStore } from '../../store/chatStore'

export default function MessageBubble({ message, onActionClick }) {
  const isUser = message.role === 'user'
  const isError = message.error
  const isFileUpload = message.fileUpload
  const { currentChatId, currentChat, updateMessage } = useChatStore()

  // Get file extension from filename
  const getFileExtension = (filename) => {
    const parts = filename.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE'
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`
          w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${isUser ? 'bg-lyzr-ferra' : 'bg-lyzr-black'}
        `}>
          {isUser ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 4L4 8v8l8 4 8-4V8l-8-4z" stroke="#F3EFEA" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Sender Label */}
          {!isUser && (
            <span className="text-xs text-lyzr-mid-4 mb-1 ml-1">Lyzr AI</span>
          )}

          {/* Bubble */}
          <div
            className={`
              px-4 py-3 rounded-2xl
              ${isFileUpload
                ? 'bg-white border border-lyzr-cream rounded-tl-md'
                : isUser
                  ? 'bg-lyzr-ferra text-white rounded-tr-md'
                  : isError
                    ? 'bg-accent-error/10 border border-accent-error/20 text-lyzr-congo rounded-tl-md'
                    : 'bg-white border border-lyzr-cream text-lyzr-congo rounded-tl-md'
              }
            `}
          >
            {isError && (
              <div className="flex items-center gap-2 mb-2 text-accent-error">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Error</span>
              </div>
            )}

            {/* File Upload Card */}
            {isFileUpload && message.fileUpload ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200"
              >
                {/* File Icon with Extension */}
                <div className="flex-shrink-0 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-[10px] font-bold text-green-700 mt-1">
                    {getFileExtension(message.fileUpload.name)}
                  </span>
                </div>

                {/* File Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-900 truncate">
                    📎 {message.fileUpload.name}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    {formatFileSize(message.fileUpload.size)}
                  </p>
                </div>

                {/* Success Check */}
                <div className="flex-shrink-0 text-green-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Message Text */}
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {message.content}
                </p>

                {/* Action Card - for RFQ or Vendor Search triggers */}
                {message.actionType && !isUser && (
                  <ActionCard
                    actionType={message.actionType}
                    onClick={() => {
                      if (message.actionType && onActionClick) {
                        onActionClick(message.actionType)
                      }
                    }}
                    isComplete={message.actionComplete}
                  />
                )}

                {/* Agents Used */}
                {message.agentsUsed && message.agentsUsed.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-lyzr-cream/50">
                    <span className="text-xs text-lyzr-mid-4 block mb-2">Agents used:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {message.agentsUsed.map((agent, i) => (
                        <Badge key={i} variant="secondary" size="sm">
                          {agent.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-[10px] text-lyzr-mid-4 mt-1 mx-1">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>
    </div>
  )
}
