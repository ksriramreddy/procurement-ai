/**
 * Extract chart JSON from websocket tool_output
 * Handles both raw JSON and Python dict wrapped formats
 * Also handles escaped JSON strings
 */
function extractChartJson(toolOutputStr) {
  console.log('[extractChartJson] 🎯 Starting extraction')
  console.log('[extractChartJson] Input type:', typeof toolOutputStr)
  console.log('[extractChartJson] Input length:', toolOutputStr?.length)
  
  if (!toolOutputStr || typeof toolOutputStr !== 'string') {
    console.log('[extractChartJson] ❌ Invalid input')
    return null
  }

  try {
    let trimmed = toolOutputStr.trim()
    
    // Check if this is an escaped JSON string (contains \" inside)
    const hasEscapedQuotes = trimmed.includes('\\"')
    console.log('[extractChartJson] Contains escaped quotes?', hasEscapedQuotes)
    
    if (hasEscapedQuotes) {
      console.log('[extractChartJson] Detected escaped JSON, unescaping first...')
      // Unescape the JSON: \" becomes "
      trimmed = trimmed.replace(/\\"/g, '"')
      console.log('[extractChartJson] After unescape, first 300 chars:', trimmed.substring(0, 300))
    }
    
    // Strategy 1: Try parsing the input directly as JSON first
    // (most common case - WebSocket sends JSON directly)
    console.log('[extractChartJson] Strategy 1: Try direct JSON parse...')
    console.log('[extractChartJson] Input first char:', trimmed[0], 'char code:', trimmed.charCodeAt(0))
    
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        console.log('[extractChartJson] Attempting JSON.parse on', trimmed.length, 'character string')
        const directParse = JSON.parse(trimmed)
        console.log('[extractChartJson] ✅ JSON.parse succeeded')
        console.log('[extractChartJson] Parsed object keys:', Object.keys(directParse))
        console.log('[extractChartJson] chart_type value:', directParse?.chart_type)
        
        if (directParse?.chart_type && ['pie', 'bar', 'line', 'text'].includes(directParse.chart_type)) {
          console.log('[extractChartJson] ✅ SUCCESS - Direct JSON parse worked!')
          if (directParse.chart_type === 'text') {
            console.log('[extractChartJson] 📄 TEXT CHART, data length:', directParse.data?.length)
            console.log('[extractChartJson] Data contains HTML links:', directParse.data?.includes('<a href'))
          }
          return directParse
        } else {
          console.log('[extractChartJson] ⚠️  No valid chart_type found, continuing to strategy 2')
        }
      } catch (e) {
        console.log('[extractChartJson] ❌ JSON.parse failed:', e.message)
        console.log('[extractChartJson] Error at position:', e.message.match(/position (\d+)/)?.[1])
        // Show context around error
        try {
          const errPos = parseInt(e.message.match(/position (\d+)/)?.[1] || 0)
          if (errPos > 0) {
            console.log('[extractChartJson] Context before error:', trimmed.substring(Math.max(0, errPos - 50), errPos))
            console.log('[extractChartJson] Context at error:', trimmed.substring(errPos, Math.min(trimmed.length, errPos + 50)))
          }
        } catch (c) {
          // ignore
        }
        // Continue to strategy 2
      }
    }

    // Strategy 2: Try extracting response field from Python dict format
    // Handles: {'response': '{"chart_type": ...}', ...}
    console.log('[extractChartJson] Strategy 2: Try Python dict extraction...')
    
    // Extract response field value using regex
    let responseValue = null
    
    // Look for 'response': '...' with proper boundary detection
    const match = toolOutputStr.match(/'response'\s*:\s*'([\s\S]*?)'\s*(?:,\s*'|,\s*"|})/)
    if (match && match[1]) {
      responseValue = match[1]
      console.log('[extractChartJson] ✅ Found response field (Python dict format)')
      
      // Try parsing the response value
      try {
        console.log('[extractChartJson] Parsing extracted response value...')
        const parsed = JSON.parse(responseValue)
        if (parsed?.chart_type && ['pie', 'bar', 'line', 'text'].includes(parsed.chart_type)) {
          console.log('[extractChartJson] ✅ SUCCESS - Python dict extraction worked!')
          return parsed
        }
      } catch (e) {
        console.log('[extractChartJson] Extracted response parse failed:', e.message)
      }
    }

    console.log('[extractChartJson] ❌ All strategies failed')
    return null

  } catch (error) {
    console.log('[extractChartJson] ❌ EXCEPTION:', error.message)
    return null
  }
}

/**
 * Extract the 'from' field from a Python dict string.
 * e.g. "'from': 'customer_procurement_manager'" → "customer_procurement_manager"
 */
function extractFromField(toolOutputStr) {
  const match = toolOutputStr.match(/'from'\s*:\s*'([^']*)'/)
  return match ? match[1] : 'customer_procurement_manager'
}

export function parseToolOutput(toolOutputStr) {
  console.log('[parseToolOutput] 📥 INPUT - Received tool_output string, length:', toolOutputStr?.length || 0)
  
  if (!toolOutputStr) {
    console.log('[parseToolOutput] ❌ FAILED - toolOutputStr is empty')
    return null
  }

  // Try the new chart extraction method first
  console.log('[parseToolOutput] Attempting new extractChartJson method...')
  const chartResult = extractChartJson(toolOutputStr)
  if (chartResult) {
    console.log('[parseToolOutput] ✅ SUCCESS - extractChartJson worked')
    return chartResult
  }

  console.log('[parseToolOutput] ⚠️  extractChartJson failed, trying legacy method...')

  try {
    // Legacy method for backwards compatibility
    console.log('[parseToolOutput] Step 1: Extracting response field (legacy)...')
    let responseMatch = toolOutputStr.match(
      /'response'\s*:\s*'([\s\S]*?)'\s*(?:,\s*'module_outputs'|,\s*'respond_directly'|}\s*$)/
    )

    if (!responseMatch) {
      console.log('[parseToolOutput] Step 1: First regex failed, trying fallback...')
      responseMatch = toolOutputStr.match(
        /'response'\s*:\s*'([\s\S]+?)(?='|\s*[,}]|$)/
      )
    }

    if (!responseMatch || !responseMatch[1]) {
      console.log('[parseToolOutput] ❌ FAILED - Could not extract response field')
      // Fallback: try to extract chart JSON directly from the raw string
      const chartFallback = extractChartFromRaw(toolOutputStr)
      if (chartFallback) {
        console.log('[parseToolOutput] ✅ SUCCESS - Used extractChartFromRaw fallback')
        return chartFallback
      }
      // Try a simpler regex for the response field as last resort
      const simpleMatch = toolOutputStr.match(/'response'\s*:\s*'([\s\S]*?)'\s*(?:,\s*'|})/)
      if (simpleMatch && simpleMatch[1]?.trim()) {
        const fromField = extractFromField(toolOutputStr)
        console.log('[parseToolOutput] ✅ Simple regex fallback, from:', fromField)
        return { from: fromField, response: simpleMatch[1].trim() }
      }
      return null
    }

    console.log('[parseToolOutput] ✅ Response field extracted, length:', responseMatch[1].length)
    console.log('[parseToolOutput] ⚠️  EXTRACTED CONTENT DEBUG:')
    let rawExtracted = responseMatch[1]
    console.log('[parseToolOutput] First 500 chars:', rawExtracted.substring(0, 500))
    console.log('[parseToolOutput] First character code:', rawExtracted.charCodeAt(0), '| char:', rawExtracted[0])
    console.log('[parseToolOutput] Last 100 chars:', rawExtracted.substring(Math.max(0, rawExtracted.length - 100)))
    console.log('[parseToolOutput] Looks like JSON (starts with { or [):', ['{', '['].includes(rawExtracted[0]))
    console.log('[parseToolOutput] Raw input around response (500 chars):', toolOutputStr.substring(Math.max(0, toolOutputStr.indexOf("'response'") - 100), toolOutputStr.indexOf("'response'") + 400))
    
    // Check if this looks like it might be code/artifact or plain text instead of JSON
    if (rawExtracted.includes('Artifact') || rawExtracted.includes('async def') || rawExtracted.includes('```')) {
      console.log('[parseToolOutput] ⚠️  WARNING: Extracted content looks like CODE/text, not JSON!')
      console.log('[parseToolOutput] First 200 chars of extracted:', rawExtracted.substring(0, 200))
      const trimmed = rawExtracted.trim()
      if (trimmed.startsWith('Artifact') || trimmed.startsWith('```') || trimmed.startsWith('async')) {
        // Try chart extraction first
        const chartFallback = extractChartFromRaw(toolOutputStr)
        if (chartFallback) {
          console.log('[parseToolOutput] ✅ Fallback worked on code content')
          return chartFallback
        }
        // Not a chart — extract as plain text response with 'from' field
        const fromField = extractFromField(toolOutputStr)
        console.log('[parseToolOutput] ✅ Returning plain text response, from:', fromField)
        return { from: fromField, response: trimmed }
      }
    }
    
    let responseStr = rawExtracted

    // Step 2: Check if response might have JSON nested inside other content
    if (responseStr[0] !== '{' && responseStr[0] !== '[') {
      console.log('[parseToolOutput] Step 1.5: Response does not start with JSON - looking for JSON object...')
      const jsonMatch = responseStr.match(/{[\s\S]*}/)
      if (jsonMatch) {
        console.log('[parseToolOutput] Found JSON object at position:', jsonMatch.index)
        responseStr = jsonMatch[0]
        console.log('[parseToolOutput] Extracted JSON portion, new length:', responseStr.length)
      } else {
        const jsonArrMatch = responseStr.match(/\[[\s\S]*]/)
        if (jsonArrMatch) {
          console.log('[parseToolOutput] Found JSON array at position:', jsonArrMatch.index)
          responseStr = jsonArrMatch[0]
          console.log('[parseToolOutput] Extracted JSON portion, new length:', responseStr.length)
        }
      }
    }

    // Step 3: Unescape escaped characters carefully to preserve HTML tags
    console.log('[parseToolOutput] Step 3: Unescaping characters...')
    
    // Preserve double backslashes first
    responseStr = responseStr.replace(/\\\\/g, '\x00DOUBLE_BACKSLASH\x00')
    
    // Unescape common escape sequences
    responseStr = responseStr.replace(/\\n/g, '\n')
    responseStr = responseStr.replace(/\\t/g, '\t')
    responseStr = responseStr.replace(/\\\//g, '/')
    
    // Unescape quotes - this is critical for HTML attributes
    responseStr = responseStr.replace(/\\"/g, '"')
    responseStr = responseStr.replace(/\\'/g, "'")
    
    // Restore double backslashes
    responseStr = responseStr.replace(/\x00DOUBLE_BACKSLASH\x00/g, '\\')

    console.log('[parseToolOutput] After unescape preview:', responseStr.substring(0, 200))
    console.log('[parseToolOutput] Contains HTML anchor tags:', responseStr.includes('<a href'))

    responseStr = responseStr.trim()

    // Step 4: Validate and close incomplete JSON if needed
    console.log('[parseToolOutput] Step 4: Validating JSON structure...')
    const openBraces = (responseStr.match(/{/g) || []).length
    const closeBraces = (responseStr.match(/}/g) || []).length
    const openBrackets = (responseStr.match(/\[/g) || []).length
    const closeBrackets = (responseStr.match(/]/g) || []).length

    console.log('[parseToolOutput] Brace check - Open:', openBraces, 'Close:', closeBraces)
    console.log('[parseToolOutput] Bracket check - Open:', openBrackets, 'Close:', closeBrackets)

    if (openBraces > closeBraces) {
      const missingBraces = openBraces - closeBraces
      responseStr += '}'.repeat(missingBraces)
      console.log('[parseToolOutput] Added', missingBraces, 'closing braces')
    }

    if (openBrackets > closeBrackets) {
      const missingBrackets = openBrackets - closeBrackets
      responseStr += ']'.repeat(missingBrackets)
      console.log('[parseToolOutput] Added', missingBrackets, 'closing brackets')
    }

    // Step 5: Parse final clean JSON
    console.log('[parseToolOutput] Step 5: Parsing JSON...')
    console.log('[parseToolOutput] 🔍 STRING TO PARSE DEBUG:')
    console.log('[parseToolOutput] String length:', responseStr.length)
    console.log('[parseToolOutput] First 500 chars:', responseStr.substring(0, 500))
    console.log('[parseToolOutput] First character:', responseStr[0], '| Code:', responseStr.charCodeAt(0))
    console.log('[parseToolOutput] Last 100 chars:', responseStr.substring(Math.max(0, responseStr.length - 100)))
    console.log('[parseToolOutput] Valid JSON start:', responseStr[0] === '{' || responseStr[0] === '[')
    
    const parsed = JSON.parse(responseStr)
    
    console.log('[parseToolOutput] ✅ SUCCESS - JSON parsed successfully')
    console.log('[parseToolOutput] Parsed chart_type:', parsed?.chart_type)
    console.log('[parseToolOutput] Parsed title:', parsed?.title)
    
    if (parsed?.chart_type === 'text') {
      console.log('[parseToolOutput] 📄 TEXT RESPONSE')
      console.log('[parseToolOutput] Data length:', parsed?.data?.length)
      console.log('[parseToolOutput] Data preview:', parsed?.data?.substring(0, 300))
    }
    
    return parsed
  } catch (err) {
    console.log('[parseToolOutput] ❌ EXCEPTION during parsing:', err.message)
    console.log('[parseToolOutput] Error name:', err.name)
    console.log('[parseToolOutput] Stack trace:', err.stack?.substring(0, 300))
    
    // Try to identify where the parse failed
    if (err.message.includes('position')) {
      const match = err.message.match(/position (\d+)/)
      if (match) {
        const pos = parseInt(match[1])
        console.log('[parseToolOutput] Parse error at position:', pos)
        // Show context around the error
        try {
          const responseMatch = toolOutputStr.match(/'response'\s*:\s*'([\s\S]*?)'\s*(?:,\s*'module_outputs'|,\s*'respond_directly'|}\s*$)/) || toolOutputStr.match(/'response'\s*:\s*'([\s\S]+?)(?='|\s*[,}]|$)/)
          if (responseMatch && responseMatch[1]) {
            const respStr = responseMatch[1]
            console.log('[parseToolOutput] Context around error:')
            console.log('[parseToolOutput] [', respStr.substring(Math.max(0, pos - 100), pos), ']⬅️ ERROR HERE ⬅️[', respStr.substring(pos, Math.min(respStr.length, pos + 100)), ']')
          }
        } catch (e) {
          // ignore
        }
      }
    }
    
    // If main parsing fails, try chart fallback
    const chartFallback = extractChartFromRaw(toolOutputStr)
    if (chartFallback) {
      console.log('[parseToolOutput] ✅ SUCCESS - Fallback extractChartFromRaw worked')
      return chartFallback
    }

    // Last resort: if we extracted a response string but couldn't parse as JSON,
    // return it as plain text so it's still displayed in chat
    const fallbackMatch = toolOutputStr.match(/'response'\s*:\s*'([\s\S]*?)'\s*(?:,\s*'|})/)
    if (fallbackMatch && fallbackMatch[1]?.trim()) {
      const fromField = extractFromField(toolOutputStr)
      console.log('[parseToolOutput] ✅ Returning plain text fallback, from:', fromField)
      return { from: fromField, response: fallbackMatch[1].trim() }
    }

    console.log('[parseToolOutput] ❌ FAILED - All methods failed')
    return null
  }
}

/**
 * Fallback: extract chart JSON from raw tool_output string.
 * Finds "chart_type" in the string and extracts the enclosing JSON object
 * by matching braces from the opening { before "chart_type".
 */
function extractChartFromRaw(rawStr) {
  if (!rawStr || !rawStr.includes('"chart_type"')) return null

  try {
    // Find the opening { before "chart_type"
    const chartTypeIdx = rawStr.indexOf('"chart_type"')
    if (chartTypeIdx === -1) return null

    // Walk backwards to find the opening {
    let start = rawStr.lastIndexOf('{', chartTypeIdx)
    if (start === -1) return null

    // Walk forward counting braces to find the matching }
    let depth = 0
    let end = -1
    let inString = false
    let escape = false

    for (let i = start; i < rawStr.length; i++) {
      const ch = rawStr[i]

      if (escape) {
        escape = false
        continue
      }

      if (ch === '\\') {
        escape = true
        continue
      }

      if (ch === '"' && !escape) {
        inString = !inString
        continue
      }

      if (!inString) {
        if (ch === '{') depth++
        else if (ch === '}') {
          depth--
          if (depth === 0) {
            end = i
            break
          }
        }
      }
    }

    if (end === -1) return null

    let jsonStr = rawStr.substring(start, end + 1)

    // Unescape
    jsonStr = jsonStr.replace(/\\\\"/g, '\x00DQ\x00')
    jsonStr = jsonStr.replace(/\\n/g, '\n')
    jsonStr = jsonStr.replace(/\\t/g, '\t')
    jsonStr = jsonStr.replace(/\\"/g, '"')
    jsonStr = jsonStr.replace(/\x00DQ\x00/g, '\\"')

    const parsed = JSON.parse(jsonStr)

    if (parsed?.chart_type && ['pie', 'bar', 'line', 'text'].includes(parsed.chart_type)) {
      console.log('[extractChartFromRaw] Successfully extracted chart_type:', parsed.chart_type)
      return parsed
    }
  } catch (err) {
    console.log('[extractChartFromRaw] Failed:', err.message)
  }

  return null
}

/**
 * Identify agent type from tool name
 */
export function identifyAgent(toolName) {
  const agentMappings = {
    'chat_decision_maker': {
      name: 'Chat Decision Maker',
      description: 'Analyzing your request...'
    },
    'internal_vendor_fetcher': {
      name: 'Internal Vendor Fetcher',
      description: 'Searching internal database...'
    },
    'external_vendor_fetcher': {
      name: 'External Vendor Fetcher',
      description: 'Searching external sources...'
    },
    'rfq_input_generator': {
      name: 'RFQ Generator',
      description: 'Preparing RFQ form...'
    },
    'customer_general_chat': {
      name: 'General Chat',
      description: 'Processing your question...'
    },
    'customer_procurement_manager': {
      name: 'Procurement Manager',
      description: 'Coordinating response...'
    }
  }

  for (const [key, value] of Object.entries(agentMappings)) {
    if (toolName.toLowerCase().includes(key.toLowerCase().replace(/_/g, ''))) {
      return value
    }
  }

  if (toolName.includes('agent_tool_')) {
    return {
      name: 'Processing Agent',
      description: 'Processing your request...'
    }
  }

  return {
    name: 'AI Agent',
    description: 'Working on your request...'
  }
}

/**
 * Parse chat decision maker response
 */
export function parseDecisionMakerResponse(data) {
  if (data?.from === 'chat_decision_maker') {
    const response = data.response || []
    const decision = Array.isArray(response) ? response[0] : response

    return {
      type: 'decision',
      decision: decision?.trim() || 'GENERAL_CHAT'
    }
  }
  return null
}

/**
 * Parse chart data response from general chat agent.
 * The agent may return a JSON string with chart_type, title, labels, data.
 * Handles pie, bar, line, and text chart types.
 */
export function parseChartResponse(data) {
  console.log('[parseChartResponse] Input data:', JSON.stringify(data)?.substring(0, 500))

  // Direct object with chart_type
  if (data?.chart_type && ['pie', 'bar', 'line', 'text'].includes(data.chart_type)) {
    console.log('[parseChartResponse] Matched direct chart_type:', data.chart_type)
    // For text type, log the data to verify HTML tags are present
    if (data.chart_type === 'text' && data.data) {
      console.log('[parseChartResponse] Text chart data preview:', data.data.substring(0, 200))
      console.log('[parseChartResponse] Contains HTML anchor tags:', data.data.includes('<a href'))
    }
    return { type: 'chart_data', chartData: data }
  }

  // Nested inside response field — could be a string (JSON) or already-parsed object
  const raw = data?.response
  if (raw && typeof raw === 'object' && raw.chart_type && ['pie', 'bar', 'line', 'text'].includes(raw.chart_type)) {
    console.log('[parseChartResponse] Matched response object chart_type:', raw.chart_type)
    if (raw.chart_type === 'text' && raw.data) {
      console.log('[parseChartResponse] Text chart data in response object:', raw.data.substring(0, 200))
      console.log('[parseChartResponse] Contains HTML anchor tags:', raw.data.includes('<a href'))
    }
    return { type: 'chart_data', chartData: raw }
  }

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (parsed?.chart_type && ['pie', 'bar', 'line', 'text'].includes(parsed.chart_type)) {
        console.log('[parseChartResponse] Matched nested string chart_type:', parsed.chart_type)
        if (parsed.chart_type === 'text' && parsed.data) {
          console.log('[parseChartResponse] Text chart data from parsed string:', parsed.data.substring(0, 200))
          console.log('[parseChartResponse] Contains HTML anchor tags:', parsed.data.includes('<a href'))
        }
        return { type: 'chart_data', chartData: parsed }
      }
    } catch (err) {
      console.log('[parseChartResponse] JSON parse failed for response string:', err.message)
    }
  }

  console.log('[parseChartResponse] No chart match, returning null')
  return null
}

/**
 * Parse general chat response
 */
export function parseGeneralChatResponse(data) {
  console.log('[parseGeneralChatResponse] Called')
  
  if (data?.from === 'customer_general_chat') {
    console.log('[parseGeneralChatResponse] ✅ Matched customer_general_chat')
    console.log('[parseGeneralChatResponse] Response type:', typeof data.response, '| Preview:', JSON.stringify(data.response)?.substring(0, 300))

    // Check if response is already a parsed object with chart_type
    if (data.response && typeof data.response === 'object' && data.response.chart_type && ['pie', 'bar', 'line', 'text'].includes(data.response.chart_type)) {
      console.log('[parseGeneralChatResponse] ✅ Detected chart object in general_chat:', data.response.chart_type)
      if (data.response.chart_type === 'text') {
        console.log('[parseGeneralChatResponse] 📄 TEXT from object')
      }
      return { type: 'chart_data', chartData: data.response }
    }

    // Check if the response is a JSON string with chart data
    if (typeof data.response === 'string') {
      try {
        const parsed = JSON.parse(data.response)
        if (parsed?.chart_type && ['pie', 'bar', 'line', 'text'].includes(parsed.chart_type)) {
          console.log('[parseGeneralChatResponse] ✅ Detected chart string in general_chat:', parsed.chart_type)
          if (parsed.chart_type === 'text') {
            console.log('[parseGeneralChatResponse] 📄 TEXT from parsed string')
            console.log('[parseGeneralChatResponse] Text data length:', parsed?.data?.length)
          }
          return { type: 'chart_data', chartData: parsed }
        }
      } catch (err) {
        console.log('[parseGeneralChatResponse] ⚠️  Not chart JSON:', err.message)
      }
    }

    console.log('[parseGeneralChatResponse] ⚠️  No chart detected - returning general_chat')
    return {
      type: 'general_chat',
      response: data.response
    }
  }
  console.log('[parseGeneralChatResponse] ⚠️  Not customer_general_chat, from:', data?.from)
  return null
}

/**
 * Parse internal vendor fetcher response
 */
export function parseInternalVendorResponse(data) {
  if (data?.vendor_name || data?.category) {
    return {
      type: 'internal_vendor_query',
      vendorNames: data.vendor_name || [],
      categories: data.category || []
    }
  }
  return null
}

/**
 * Parse external vendor fetcher response
 */
export function parseExternalVendorResponse(data) {
  let vendorsArray = null

  if (data?.vendors && Array.isArray(data.vendors)) {
    vendorsArray = data.vendors
  } else if (data?.data?.vendors && Array.isArray(data.data.vendors)) {
    vendorsArray = data.data.vendors
  } else if (data?.from === 'external_vendor_fetcher' && data?.vendors) {
    vendorsArray = data.vendors
  }

  if (vendorsArray && vendorsArray.length > 0) {
    const transformedVendors = vendorsArray.map(v => ({
      name: v.vendor_name || v.name,
      website: v.website,
      description: v.description,
      services: v.services || [],
      pricingModel: v.pricing_model,
      certifications: v.certifications || [],
      headquarters: v.headquarters,
      sourceUrls: v.source_urls || [],
      complianceScore: v.compliance_assessment?.compliance_score,
      complianceRating: v.compliance_assessment?.compliance_rating
    }))
    return {
      type: 'external_vendors',
      vendors: transformedVendors
    }
  }
  return null
}

/**
 * Parse RFP input response
 */
export function parseRfpResponse(data) {
  if (data?.project_title && data?.scope) {
    let mandatoryReqs = data.mandatory_requirements || ''
    if (Array.isArray(mandatoryReqs)) {
      mandatoryReqs = mandatoryReqs.join(', ')
    }

    return {
      type: 'rfp_data',
      rfpId: data.rfp_id || '',
      issuedBy: data.issued_by || '',
      projectTitle: data.project_title || '',
      scope: data.scope || '',
      mandatoryRequirements: mandatoryReqs,
      submissionDeadline: data.submission_deadline || '',
      evaluationBasis: data.evaluation_basis || '',
      contactChannel: data.contact_channel || '',
      messageToCustomer: data.message_to_customer || '',
      additionalFields: Array.isArray(data.additional_fields) ? data.additional_fields : []
    }
  }
  return null
}

/**
 * Parse contract input response
 */
export function parseContractResponse(data) {
  if (data?.parties && data?.scope && data?.fees) {
    return {
      type: 'contract_data',
      vendorName: data.parties?.vendor_name || '',
      customerName: data.parties?.customer_name || '',
      scope: data.scope || '',
      feeAmount: data.fees?.amount != null ? String(data.fees.amount) : '',
      feeCurrency: data.fees?.currency || 'USD',
      paymentTerms: data.fees?.payment_terms || '',
      startDate: data.term?.start_date || '',
      endDate: data.term?.end_date || '',
      confidentiality: data.confidentiality ?? true,
      liabilityCap: data.liability_cap != null ? String(data.liability_cap) : '',
      governingLaw: data.governing_law || ''
    }
  }
  return null
}

/**
 * Parse RFQ input generator response
 */
export function parseRfqResponse(data) {
  if (data?.from === 'rfq_input_generator' || data?.rfq_id) {
    return {
      type: 'rfq_data',
      rfqId: data.rfq_id,
      organizationName: data.organization_name,
      contactPerson: data.contact_person || {},
      procurementType: data.procurement_type,
      requirementSummary: data.requirement_summary,
      quantity: data.quantity,
      deliveryTimeline: data.delivery_timeline,
      budgetRange: data.budget_range,
      responseDeadline: data.response_deadline,
      additionalFields: Array.isArray(data.additional_fields) ? data.additional_fields : []
    }
  }
  return null
}

/**
 * Parse pricing suggestion response
 */
export function parsePricingSuggestionResponse(data) {
  if (data?.from === 'ai_price_suggestion' && data?.price != null) {
    return {
      type: 'pricing_suggestion',
      price: data.price,
      currency: data.currency || 'USD'
    }
  }
  return null
}

/**
 * Parse manager agent final response
 */
export function parseManagerResponse(data) {
  if (data?.from === 'customer_procurement_manager') {
    return {
      type: 'manager_response',
      agentsCalledSequence: data.agents_called_sequence || [],
      response: data.response
    }
  }
  return null
}

/**
 * Main parser that tries all parsers
 */
export function parseAgentOutput(data) {
  console.log('[parseAgentOutput] 🎯 MAIN PARSER - Attempting to parse agent output')
  
  if (!data) {
    console.log('[parseAgentOutput] ❌ FAILED - data is empty')
    return null
  }

  const parsers = [
    { name: 'parsePricingSuggestionResponse', fn: parsePricingSuggestionResponse },
    { name: 'parseChartResponse', fn: parseChartResponse },
    { name: 'parseManagerResponse', fn: parseManagerResponse },
    { name: 'parseGeneralChatResponse', fn: parseGeneralChatResponse },
    { name: 'parseDecisionMakerResponse', fn: parseDecisionMakerResponse },
    { name: 'parseContractResponse', fn: parseContractResponse },
    { name: 'parseRfpResponse', fn: parseRfpResponse },
    { name: 'parseRfqResponse', fn: parseRfqResponse },
    { name: 'parseExternalVendorResponse', fn: parseExternalVendorResponse },
    { name: 'parseInternalVendorResponse', fn: parseInternalVendorResponse }
  ]

  for (const { name, fn } of parsers) {
    console.log('[parseAgentOutput] Trying parser:', name)
    const result = fn(data)
    if (result) {
      console.log('[parseAgentOutput] ✅ SUCCESS - Parser matched:', name, '| Result type:', result.type)
      if (data.message && !result.message) {
        result.message = data.message
      }
      return result
    }
  }

  console.log('[parseAgentOutput] ⚠️  No parser matched - returning unknown')
  return { type: 'unknown', data }
}
