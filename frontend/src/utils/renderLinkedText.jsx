/**
 * Parses text containing <a href="vendor_id">vendor_name</a> tags
 * and returns React elements with clickable vendor links.
 * Handles optional attributes like className="internal_link".
 *
 * @param {string} text - The text potentially containing anchor tags
 * @param {function} onVendorClick - Callback when a vendor link is clicked: (vendorId) => void
 * @returns {React.ReactNode[]} - Array of text nodes and clickable vendor link elements
 */
export function renderLinkedText(text, onVendorClick) {
  if (!text || typeof text !== 'string') {
    return text
  }

  // Match <a ...href="..."...>text</a> — handles any attribute order (className, href, etc.)
  const anchorRegex = /<a\s+[^>]*?href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/gi
  const parts = []
  let lastIndex = 0
  let match

  while ((match = anchorRegex.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index)
      if (textBefore) {
        parts.push(textBefore)
      }
    }

    const vendorId = match[1]
    const vendorName = match[2]

    parts.push(
      <button
        key={`vendor-${match.index}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (onVendorClick) onVendorClick(vendorId)
        }}
        className="internal-link"
        title={`View details: ${vendorName}`}
      >
        {vendorName}
      </button>
    )

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex)
    if (remainingText) {
      parts.push(remainingText)
    }
  }

  // No anchor tags found — return original text
  if (parts.length === 0) {
    return text
  }

  return parts
}
