import { motion } from 'framer-motion'
import MessageBubble from './MessageBubble'

export default function MessageList({ messages, onActionClick }) {
  return (
    <div className="space-y-6">
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <MessageBubble message={message} onActionClick={onActionClick} />
        </motion.div>
      ))}
    </div>
  )
}
