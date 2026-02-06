/**
 * Extract clean JSON from tool_output in the metrics WebSocket event
 *
 * tool_output format:
 * "{'response': '{\"from\":\"rfq_input_generator\", ... }', 'module_outputs': {}, 'respond_directly': False}"
 */
export function parseToolOutput(toolOutputStr) {
  if (!toolOutputStr) return null

  try {
    // Step 1: Extract ONLY the response value safely
    const responseMatch = toolOutputStr.match(
      /'response'\s*:\s*'([\s\S]*?)'\s*(,|})/
    )

    if (!responseMatch || !responseMatch[1]) {
      console.error('❌ response field not found in tool_output')
      console.log('Raw tool_output:', toolOutputStr.substring(0, 300))
      return null
    }

    let responseStr = responseMatch[1]

    // Step 2: Unescape escaped characters
    responseStr = responseStr
      .replace(/\\n/g, '')
      .replace(/\\"/g, '"')
      .trim()

    // Step 3: Parse final clean JSON
    const parsed = JSON.parse(responseStr)

    console.log('✅ EXTRACTED CLEAN JSON:')
    console.log(JSON.stringify(parsed, null, 2))

    return parsed
  } catch (err) {
    console.error('❌ Failed parsing inner response JSON:', err.message)
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
 */
export function parseExternalVendorResponse(data) {
  if (data?.vendors && Array.isArray(data.vendors)) {
    console.log('🔍 parseExternalVendorResponse: Found vendors array with', data.vendors.length, 'vendors')
    const transformedVendors = data.vendors.map(v => ({
      name: v.vendor_name,
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
