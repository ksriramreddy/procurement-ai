/**
 * Generates a unique chat ID
 * Format: CHAT-{timestamp}-{random}
 */
export function generateChatId() {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `CHAT-${timestamp}-${random}`
}

/**
 * Generates a session ID for LYZR API
 * Format: {agentId}-CHAT-{timestamp}
 */
export function generateSessionId(agentId) {
  return `${agentId}-CHAT-${Date.now()}`
}
