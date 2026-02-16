export function parseToolOutput(toolOutputStr) {
  if (!toolOutputStr) return null

  try {
    // Step 1: Extract the response value
    let responseMatch = toolOutputStr.match(
      /'response'\s*:\s*'([\s\S]*?)'\s*(?:,\s*'module_outputs'|,\s*'respond_directly'|}\s*$)/
    )

    if (!responseMatch) {
      responseMatch = toolOutputStr.match(
        /'response'\s*:\s*'([\s\S]+?)(?='|\s*[,}]|$)/
      )
    }

    if (!responseMatch || !responseMatch[1]) {
      return null
    }

    let responseStr = responseMatch[1]

    // Step 2: Unescape escaped characters in the correct order
    responseStr = responseStr.replace(/\\\\/g, '\x00DOUBLE_BACKSLASH\x00')
    responseStr = responseStr.replace(/\\n/g, '\n')
    responseStr = responseStr.replace(/\\t/g, '\t')
    responseStr = responseStr.replace(/\\"/g, '"')
    responseStr = responseStr.replace(/\\'/g, "'")
    responseStr = responseStr.replace(/\\\//g, '/')
    responseStr = responseStr.replace(/\x00DOUBLE_BACKSLASH\x00/g, '\\')

    responseStr = responseStr.trim()

    // Step 3: Validate and close incomplete JSON if needed
    const openBraces = (responseStr.match(/{/g) || []).length
    const closeBraces = (responseStr.match(/}/g) || []).length
    const openBrackets = (responseStr.match(/\[/g) || []).length
    const closeBrackets = (responseStr.match(/]/g) || []).length

    if (openBraces > closeBraces) {
      responseStr += '}'.repeat(openBraces - closeBraces)
    }

    if (openBrackets > closeBrackets) {
      responseStr += ']'.repeat(openBrackets - closeBrackets)
    }

    // Step 4: Parse final clean JSON
    const parsed = JSON.parse(responseStr)
    return parsed
  } catch (err) {
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
 * Parse general chat response
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
  if (!data) return null

  const parsers = [
    parsePricingSuggestionResponse,
    parseManagerResponse,
    parseGeneralChatResponse,
    parseDecisionMakerResponse,
    parseContractResponse,
    parseRfpResponse,
    parseRfqResponse,
    parseExternalVendorResponse,
    parseInternalVendorResponse
  ]

  for (const parser of parsers) {
    const result = parser(data)
    if (result) {
      if (data.message && !result.message) {
        result.message = data.message
      }
      return result
    }
  }

  return { type: 'unknown', data }
}
