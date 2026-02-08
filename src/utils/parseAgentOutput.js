export function parseToolOutput(toolOutputStr) {
  if (!toolOutputStr) return null

  try {
    // Step 1: Extract the response value
    // First try to find the full response value with proper closing quote
    let responseMatch = toolOutputStr.match(
      /'response'\s*:\s*'([\s\S]*?)'\s*(?:,\s*'module_outputs'|,\s*'respond_directly'|}\s*$)/
    )
    
    // If that fails, try a more lenient pattern for incomplete responses
    if (!responseMatch) {
      responseMatch = toolOutputStr.match(
        /'response'\s*:\s*'([\s\S]+?)(?='|\s*[,}]|$)/
      )
    }

    if (!responseMatch || !responseMatch[1]) {
      console.error('❌ response field not found in tool_output')
      console.log('Raw tool_output:', toolOutputStr.substring(0, 500))
      return null
    }

    let responseStr = responseMatch[1]
    console.log('📥 Raw extracted response length:', responseStr.length, 'chars')

    // Step 2: Unescape escaped characters in the correct order
    // First, handle double backslashes (\\) to preserve them during unescaping
    responseStr = responseStr.replace(/\\\\/g, '\x00DOUBLE_BACKSLASH\x00')
    
    // Then unescape newlines, quotes, and other escape sequences
    responseStr = responseStr.replace(/\\n/g, '\n')  // Convert escaped newlines back to actual newlines
    responseStr = responseStr.replace(/\\t/g, '\t')  // Convert escaped tabs back to actual tabs
    responseStr = responseStr.replace(/\\"/g, '"')   // Unescape double quotes
    responseStr = responseStr.replace(/\\'/g, "'")   // Unescape single quotes
    responseStr = responseStr.replace(/\\\//g, '/')  // Unescape forward slashes
    
    // Restore double backslashes
    responseStr = responseStr.replace(/\x00DOUBLE_BACKSLASH\x00/g, '\\')

    responseStr = responseStr.trim()
    
    // Step 3: Validate and close incomplete JSON if needed
    // Check if JSON is incomplete (missing closing braces/brackets)
    const openBraces = (responseStr.match(/{/g) || []).length
    const closeBraces = (responseStr.match(/}/g) || []).length
    const openBrackets = (responseStr.match(/\[/g) || []).length
    const closeBrackets = (responseStr.match(/]/g) || []).length
    
    if (openBraces > closeBraces) {
      console.warn(`⚠️ Incomplete JSON: ${openBraces} opening braces but ${closeBraces} closing braces`)
      responseStr += '}'.repeat(openBraces - closeBraces)
    }
    
    if (openBrackets > closeBrackets) {
      console.warn(`⚠️ Incomplete JSON: ${openBrackets} opening brackets but ${closeBrackets} closing brackets`)
      responseStr += ']'.repeat(openBrackets - closeBrackets)
    }

    // Step 4: Parse final clean JSON
    const parsed = JSON.parse(responseStr)

    console.log('✅ Successfully parsed JSON from WebSocket response')
    return parsed
  } catch (err) {
    console.error('❌ Failed parsing inner response JSON:', err.message)
    console.error('   Attempted to parse:', toolOutputStr?.substring(0, 500))
    return null
  }
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

  // Check if tool name contains any of the agent identifiers
  for (const [key, value] of Object.entries(agentMappings)) {
    if (toolName.toLowerCase().includes(key.toLowerCase().replace(/_/g, ''))) {
      return value
    }
  }

  // Try to extract meaningful name from tool_name
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
 * Example: {"from": "chat_decision_maker", "response": ["GENERAL CHAT"]}
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
 * Parse general chat response
 * Example: {"from": "customer_general_chat", "response": "I can confirm..."}
 */
export function parseGeneralChatResponse(data) {
  if (data?.from === 'customer_general_chat') {
    return {
      type: 'general_chat',
      response: data.response
    }
  }
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
 * Example: {"vendors": [{"vendor_name": "Dell", ...}]}
 * Also handles nested structure like: {"data": {"vendors": [...]}}
 * Or from field: {"from": "external_vendor_fetcher", "vendors": [...]}
 */
export function parseExternalVendorResponse(data) {
  // Check for vendors at different possible locations
  let vendorsArray = null
  
  if (data?.vendors && Array.isArray(data.vendors)) {
    vendorsArray = data.vendors
  } else if (data?.data?.vendors && Array.isArray(data.data.vendors)) {
    vendorsArray = data.data.vendors
  } else if (data?.from === 'external_vendor_fetcher' && data?.vendors) {
    vendorsArray = data.vendors
  }
  
  if (vendorsArray && vendorsArray.length > 0) {
    console.log('🔍 parseExternalVendorResponse: Found vendors array with', vendorsArray.length, 'vendors')
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
    console.log('🔍 Transformed vendors:', transformedVendors)
    return {
      type: 'external_vendors',
      vendors: transformedVendors
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
      responseDeadline: data.response_deadline
    }
  }
  return null
}

/**
 * Parse pricing suggestion response
 * Example: {"from": "ai_price_suggestion", "price": 8000}
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
  if (!data) return null

  // Try each parser in order of specificity
  const parsers = [
    parsePricingSuggestionResponse,
    parseManagerResponse,
    parseGeneralChatResponse,
    parseDecisionMakerResponse,
    parseRfqResponse,
    parseExternalVendorResponse,
    parseInternalVendorResponse
  ]

  for (const parser of parsers) {
    const result = parser(data)
    if (result) return result
  }

  // Return raw data if no parser matched
  return { type: 'unknown', data }
}
