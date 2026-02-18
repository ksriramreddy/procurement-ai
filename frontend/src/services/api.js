const CHAT_URL = import.meta.env.VITE_LYZR_CHAT_URL || 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/'
const ASSET_UPLOAD_URL = import.meta.env.VITE_LYZR_ASSET_UPLOAD_URL || 'https://agent-prod.studio.lyzr.ai/v3/assets/upload'

/**
 * Get environment variables
 */
function getConfig() {
  return {
    apiKey: import.meta.env.VITE_LYZR_API_KEY,
    userId: import.meta.env.VITE_LYZR_USER_ID,
    agentId: import.meta.env.VITE_LYZR_AGENT_ID
  }
}

/**
 * Upload file to LYZR Assets API
 * @param {File} file - File to upload (pdf, pptx, docx, jpg, png)
 * @returns {Promise<string>} - Asset ID
 */
export async function uploadAsset(file) {
  const config = getConfig()
  
  // Validate file type
  const supportedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
  
  if (!supportedTypes.includes(file.type)) {
    throw new Error(`Unsupported file type: ${file.type}. Supported types: PDF, PPTX, DOCX, JPG, PNG`)
  }
  
  const formData = new FormData()
  formData.append('files', file)
  
  try {
    const response = await fetch(ASSET_UPLOAD_URL, {
      method: 'POST',
      headers: {
        'x-api-key': config.apiKey
      },
      body: formData
    })
    
    if (!response.ok) {
      throw new Error(`Asset upload failed: ${response.status}`)
    }
    
    const data = await response.json()

    // Extract asset_id from response
    const result = data.results?.[0]
    
    if (!result || !result.success || !result.asset_id) {
      throw new Error(`Asset upload failed: ${result?.error || 'Unknown error'}`)
    }
    
    const assetId = result.asset_id

    return assetId
  } catch (error) {
    throw error
  }
}

/**
 * Send message to LYZR Chat API
 * @param {string} message - User message
 * @param {string} sessionId - Session ID for the chat
 * @param {Array<string>} assets - Optional array of asset IDs to include
 * @returns {Promise<object>} - API response
 */
export async function sendMessage(message, sessionId, assets = []) {
  const config = getConfig()

  const messagePayload = {
    action: 'execute',
    request_id: sessionId,
    message: message
  }

  const requestBody = {
    user_id: config.userId,
    agent_id: config.agentId,
    session_id: sessionId,
    message: JSON.stringify(messagePayload)
  }

  // Add assets if provided
  if (assets && assets.length > 0) {
    requestBody.assets = assets
  }

  try {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const extracted = extractFinalJSON(data)
    return extracted
  } catch (error) {
    throw error
  }
}

/**
 * Manually extract known fields from a JSON-like string when JSON.parse fails.
 * Handles LLM-generated responses where the "content" field contains raw
 * newlines, unescaped quotes, backslashes, etc.
 */
function extractFieldsManually(str) {
  // Extract "from" field (short value, no special chars expected)
  const fromMatch = str.match(/"from"\s*:\s*"([^"]*)"/)
  const from = fromMatch ? fromMatch[1] : null

  // Extract "message" field first (short value, appears after content)
  // We look for "message" key that comes after the long content
  let message = null
  const messageMatch = str.match(/"message"\s*:\s*"([^"]*)"/)
  if (messageMatch) {
    message = messageMatch[1]
  }

  // Extract "content" field using position-based slicing.
  // Find "content" key, then the opening " of its value, then slice until
  // the last " before "message" key or the final }.
  const contentKeyIdx = str.indexOf('"content')
  if (contentKeyIdx !== -1) {
    const colonIdx = str.indexOf(':', contentKeyIdx + 8)
    if (colonIdx !== -1) {
      const openQuote = str.indexOf('"', colonIdx + 1)
      // If there's a "message" field after content, find the boundary
      const messageKeyIdx = str.indexOf('"message"', contentKeyIdx + 10)
      let closeQuote
      if (messageKeyIdx !== -1) {
        // Close quote is the last " before the "message" key
        closeQuote = str.lastIndexOf('"', messageKeyIdx - 1)
      } else {
        const lastBrace = str.lastIndexOf('}')
        closeQuote = str.lastIndexOf('"', lastBrace)
      }
      if (openQuote !== -1 && closeQuote > openQuote) {
        const content = str.substring(openQuote + 1, closeQuote)
        const result = { from, content }
        if (message) result.message = message
        return result
      }
    }
  }

  // Extract "price" field (for pricing agent fallback)
  const priceMatch = str.match(/"price"\s*:\s*(\d+(?:\.\d+)?)/)
  if (priceMatch) {
    return { from, price: parseFloat(priceMatch[1]) }
  }

  // Nothing could be extracted — return raw string
  return { response: str }
}

/**
 * Extract final business JSON from LYZR response
 */
function extractFinalJSON(apiResponse) {
  if (!apiResponse || typeof apiResponse.response !== 'string') {
    return apiResponse
  }

  let responseStr = apiResponse.response

  // Remove outer quotes if present
  if (responseStr.startsWith('"')) {
    try {
      responseStr = JSON.parse(responseStr)
    } catch {
      // Keep as is if parsing fails
    }
  }

  // Try to parse as JSON directly (works for simple responses like pricing)
  try {
    return JSON.parse(responseStr)
  } catch {
    // JSON.parse failed — the response likely contains raw newlines or
    // unescaped chars inside string values (common with LLM-generated
    // RFQ documents). Fall back to position-based field extraction.
    return extractFieldsManually(responseStr)
  }
}

/**
 * Generate session ID for LYZR
 */
export function generateLyzrSessionId() {
  const config = getConfig()
  return `${config.agentId}-CHAT-${Date.now()}`
}

/**
 * Get API configuration
 */
export function getApiConfig() {
  return getConfig()
}

/**
 * Generate RFQ document by calling the RFQ generator agent
 * @param {object} rfqFormData - The RFQ form data
 * @returns {Promise<object>} - { from, content } where content is the full RFQ document
 */
export async function generateRfqDocument(rfqFormData) {
  const config = getConfig()
  const RFQ_AGENT_ID = import.meta.env.VITE_LYZR_RFQ_AGENT_ID
  const sessionId = `${RFQ_AGENT_ID}-${Date.now()}`

  const messagePayload = {
    from: 'rfq_input_generator',
    rfq_id: rfqFormData.rfq_id || '',
    organization_name: rfqFormData.organization_name || '',
    contact_person: {
      name: rfqFormData.contact_name || '',
      email: rfqFormData.contact_email || ''
    },
    procurement_type: rfqFormData.procurement_type || '',
    requirement_summary: rfqFormData.requirement_summary || '',
    quantity: rfqFormData.quantity || '',
    delivery_timeline: rfqFormData.delivery_timeline || '',
    budget_range: rfqFormData.budget_range || '',
    response_deadline: rfqFormData.response_deadline || '',
    additional_fields: rfqFormData.additional_fields || []
  }

  const requestBody = {
    user_id: config.userId,
    agent_id: RFQ_AGENT_ID,
    session_id: sessionId,
    message: JSON.stringify(messagePayload)
  }

  const response = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    throw new Error(`RFQ generator API failed: ${response.status}`)
  }

  const data = await response.json()
  const parsed = extractFinalJSON(data)
  return parsed
}

/**
 * Generate RFP document by calling the RFP document generator agent
 * @param {object} rfpFormData - The RFP form data
 * @returns {Promise<object>} - { from, content, message } where content is the full RFP document
 */
export async function generateRfpDocument(rfpFormData) {
  const config = getConfig()
  const RFP_AGENT_ID = import.meta.env.VITE_LYZR_RFP_AGENT_ID
  const sessionId = `${RFP_AGENT_ID}-${Date.now()}`

  const rfpInput = {
    rfp_id: rfpFormData.rfp_id || '',
    issued_by: rfpFormData.issued_by || '',
    project_title: rfpFormData.project_title || '',
    scope: rfpFormData.scope || '',
    mandatory_requirements: rfpFormData.mandatory_requirements
      ? rfpFormData.mandatory_requirements.split('\n').filter(Boolean)
      : [],
    submission_deadline: rfpFormData.submission_deadline || '',
    evaluation_basis: rfpFormData.evaluation_basis || '',
    contact_channel: rfpFormData.contact_channel || '',
    additional_fields: rfpFormData.additional_fields || []
  }

  const requestBody = {
    user_id: config.userId,
    agent_id: RFP_AGENT_ID,
    session_id: sessionId,
    message: 'Convert the following RFP input into a structured understanding.',
    messages: [
      {
        role: 'user',
        content: JSON.stringify(rfpInput, null, 2)
      }
    ]
  }

  const response = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    throw new Error(`RFP generator API failed: ${response.status}`)
  }

  const data = await response.json()
  const parsed = extractFinalJSON(data)

  // Normalize: the agent sometimes returns "content: :" instead of "content"
  if (parsed && !parsed.content) {
    const contentKey = Object.keys(parsed).find(k => k.startsWith('content'))
    if (contentKey && contentKey !== 'content') {
      parsed.content = parsed[contentKey]
      delete parsed[contentKey]
    }
  }

  return parsed
}

/**
 * Generate Contract document by calling the contract document generator agent
 * @param {object} contractFormData - The contract form data
 * @returns {Promise<object>} - { from, content, message } where content is the HTML contract document
 */
export async function generateContractDocument(contractFormData) {
  const config = getConfig()
  const CONTRACT_AGENT_ID = import.meta.env.VITE_LYZR_CONTRACT_AGENT_ID
  const sessionId = `${CONTRACT_AGENT_ID}-${Date.now()}`

  const contractInput = {
    parties: {
      vendor_name: contractFormData.vendor_name || '',
      customer_name: contractFormData.customer_name || ''
    },
    scope: contractFormData.scope || '',
    fees: {
      amount: contractFormData.fee_amount ? Number(contractFormData.fee_amount) : 0,
      currency: contractFormData.fee_currency || 'USD',
      payment_terms: contractFormData.payment_terms || ''
    },
    term: {
      start_date: contractFormData.start_date || '',
      end_date: contractFormData.end_date || ''
    },
    confidentiality: contractFormData.confidentiality ?? true,
    liability_cap: contractFormData.liability_cap ? Number(contractFormData.liability_cap) : 0,
    governing_law: contractFormData.governing_law || ''
  }

  const requestBody = {
    user_id: config.userId,
    agent_id: CONTRACT_AGENT_ID,
    session_id: sessionId,
    message: 'Please validate and confirm the contract details below.',
    messages: [
      {
        role: 'user',
        content: JSON.stringify(contractInput, null, 2)
      }
    ]
  }

  const response = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    throw new Error(`Contract generator API failed: ${response.status}`)
  }

  const data = await response.json()
  const parsed = extractFinalJSON(data)

  // Normalize: the agent sometimes returns "content: :" instead of "content"
  if (parsed && !parsed.content) {
    const contentKey = Object.keys(parsed).find(k => k.startsWith('content'))
    if (contentKey && contentKey !== 'content') {
      parsed.content = parsed[contentKey]
      delete parsed[contentKey]
    }
  }

  return parsed
}

/**
 * Call pricing suggestion agent to get AI-suggested pricing for procurement
 * @param {object} procurementDetails - The procurement details (quantity, type, etc.)
 * @returns {Promise<object>} - { from: 'ai_price_suggestion', price: <number> }
 */
export async function callPricingSuggestionAgent(procurementDetails) {
  const config = getConfig()
  const PRICING_AGENT_ID = import.meta.env.VITE_LYZR_PRICING_AGENT_ID
  const sessionId = `${PRICING_AGENT_ID}-pricing-${Date.now()}`

  const messagePayload = {
    intent: 'pricing_suggestion',
    procurement_details: {
      quantity: procurementDetails.quantity || '',
      item: procurementDetails.procurementType || procurementDetails.item || '',
      requirement_summary: procurementDetails.requirement_summary || '',
      contract_duration: procurementDetails.deliveryTimeline || '',
      budget_range: procurementDetails.budget_range || ''
    }
  }

  const requestBody = {
    user_id: config.userId,
    agent_id: PRICING_AGENT_ID,
    session_id: sessionId,
    message: JSON.stringify(messagePayload)
  }

  try {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Pricing agent API failed: ${response.status}`)
    }
    const data = await response.json()
    const parsed = extractFinalJSON(data)
    return parsed
  } catch (error) {
    throw error
  }
}

/**
 * Call vendor analysis agent to get AI-generated details about external vendors
 * @param {object} vendorInfo - The vendor information (name, headquarters, website, description, services, compliance_score, compliance_rating)
 * @returns {Promise<object>} - Vendor analysis with overview, positioning, advantages, disadvantages, risks, and use case fit
 */
export async function callVendorAnalysisAgent(vendorInfo) {
  const config = getConfig()
  const VENDOR_ANALYSIS_AGENT_ID = import.meta.env.VITE_LYZR_VENDOR_ANALYSIS_AGENT_ID
  const sessionId = `${VENDOR_ANALYSIS_AGENT_ID}-analysis-${Date.now()}`

  const messagePayload = {
    vendor_name: vendorInfo.name || '',
    headquarters: vendorInfo.headquarters || '',
    website: vendorInfo.website || '',
    description: vendorInfo.description || '',
    services: vendorInfo.categories || vendorInfo.services || [],
    compliance_score: vendorInfo.complianceScore || 0,
    compliance_rating: vendorInfo.complianceRating || ''
  }

  const requestBody = {
    user_id: config.userId,
    agent_id: VENDOR_ANALYSIS_AGENT_ID,
    session_id: sessionId,
    message: JSON.stringify(messagePayload)
  }

  try {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`Vendor analysis API failed: ${response.status}`)
    }

    const data = await response.json()
    const parsed = extractFinalJSON(data)
    return parsed
  } catch (error) {
    throw error
  }
}

/**
 * Call vendor certification suggester agent.
 * Takes RFQ/RFP form data, returns mandatory certs, good-to-have certs, and summary.
 * @param {object} formData - The RFQ form data (snake_case keys from the form)
 * @returns {Promise<{ mandatory: string[], good_to_have: string[], summary: string }>}
 */
export async function callCertificationAgent(formData, chatSessionId) {
  const config = getConfig()
  const CERT_AGENT_ID = import.meta.env.VITE_LYZR_CERTIFICATION_AGENT_ID
  const sessionId = chatSessionId || `${CERT_AGENT_ID}-${Date.now()}`

  const messagePayload = {
    from: 'rfq_input_generator',
    rfq_id: formData.rfq_id || '',
    organization_name: formData.organization_name || '',
    contact_person: {
      name: formData.contact_name || '',
      email: formData.contact_email || ''
    },
    procurement_type: formData.procurement_type || '',
    requirement_summary: formData.requirement_summary || '',
    quantity: formData.quantity || '',
    delivery_timeline: formData.delivery_timeline || '',
    budget_range: formData.budget_range || '',
    response_deadline: formData.response_deadline || '',
    additional_fields: formData.additional_fields || []
  }

  const requestBody = {
    user_id: config.userId,
    agent_id: CERT_AGENT_ID,
    session_id: sessionId,
    message: JSON.stringify(messagePayload)
  }

  const response = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    throw new Error(`Certification agent API failed: ${response.status}`)
  }

  const data = await response.json()
  const parsed = extractFinalJSON(data)
  return {
    mandatory: parsed?.mandatory || [],
    good_to_have: parsed?.good_to_have || [],
    summary: parsed?.summary || ''
  }
}

/**
 * Call OCR agent to verify a certification document.
 * 1. Upload file to LYZR assets API → get asset_id
 * 2. Call OCR agent with certificate name + asset
 * 3. Return { certificate_name, ocr_quality_score, extracted_text }
 *
 * @param {string} certName - The certification name (e.g. "ISO IEC 27001")
 * @param {File} file - The file to OCR
 * @param {string} threadId - Used as session_id so each thread keeps its own session
 * @returns {Promise<{certificate_name: string, ocr_quality_score: number, extracted_text: string}>}
 */
export async function callOcrAgent(certName, file, threadId) {
  const config = getConfig()
  const OCR_AGENT_ID = import.meta.env.VITE_LYZR_OCR_AGENT_ID

  // Step 1: Upload file to LYZR assets
  const assetId = await uploadAsset(file)

  // Step 2: Call OCR agent
  const requestBody = {
    user_id: config.userId,
    agent_id: OCR_AGENT_ID,
    session_id: threadId,
    message: certName,
    assets: [assetId]
  }

  const response = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    throw new Error(`OCR agent API failed: ${response.status}`)
  }

  const data = await response.json()
  const parsed = extractFinalJSON(data)
  return {
    certificate_name: parsed?.certificate_name || certName,
    ocr_quality_score: parsed?.ocr_quality_score ?? null,
    extracted_text: parsed?.extracted_text || ''
  }
}

/**
 * Call certificate verifier agent to validate a certificate after OCR.
 * Takes the full OCR output and sends it to the verifier agent.
 *
 * @param {object} ocrResult - { certificate_name, extracted_text, ocr_quality_score }
 * @param {string} threadId - Used as session_id (same session as OCR)
 * @returns {Promise<{certificate_name: string, validation_status: string, reason: string, confidence_score: number}>}
 */
export async function callCertVerifierAgent(ocrResult, threadId) {
  const config = getConfig()
  const VERIFIER_AGENT_ID = import.meta.env.VITE_LYZR_CERT_VERIFIER_AGENT_ID

  const messagePayload = {
    user_message: { value: 'verify the give certificate valid or not' },
    agent_ocr_for_ve: {
      certificate_name: ocrResult.certificate_name,
      extracted_text: ocrResult.extracted_text,
      ocr_quality_score: ocrResult.ocr_quality_score
    }
  }

  const requestBody = {
    user_id: config.userId,
    agent_id: VERIFIER_AGENT_ID,
    session_id: threadId,
    message: JSON.stringify(messagePayload)
  }

  const response = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    throw new Error(`Certificate verifier API failed: ${response.status}`)
  }

  const data = await response.json()
  const parsed = extractFinalJSON(data)
  return {
    certificate_name: parsed?.certificate_name || ocrResult.certificate_name,
    validation_status: parsed?.validation_status || 'UNABLE_TO_VERIFY',
    reason: parsed?.reason || '',
    confidence_score: parsed?.confidence_score ?? null
  }
}

/**
 * Call Negotiation Agent
 * Sends the customer requirement summary and vendor message to the negotiation agent.
 * Uses thread_id as session_id. Returns parsed response content.
 */
const NEGOTIATION_AGENT_ID = import.meta.env.VITE_LYZR_NEGOTIATION_AGENT_ID || '6992e3c032a75e26d972bc90'

export async function callNegotiationAgent({ customerSummary, vendorMessage, customerMessage, threadId }) {
  const config = getConfig()

  const messagePayload = { customer_summary: customerSummary }
  if (customerMessage) {
    messagePayload.customer_message = customerMessage
  } else {
    messagePayload.vendor_message = vendorMessage
  }

  const requestBody = {
    user_id: config.userId,
    agent_id: NEGOTIATION_AGENT_ID,
    session_id: threadId,
    message: JSON.stringify(messagePayload)
  }

  const response = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    throw new Error(`Negotiation agent API failed: ${response.status}`)
  }

  const data = await response.json()

  // Parse the response — format: { response: "{\"content\":\"...\",\"flag\":0}" }
  try {
    const responseStr = data?.response || ''
    const parsed = JSON.parse(responseStr)
    return { content: parsed.content || '', flag: parsed.flag ?? 0 }
  } catch {
    // If response is plain text
    return { content: data?.response || '', flag: 0 }
  }
}

/**
 * Fetch negotiation session history for a thread.
 * Proxied through the FastAPI backend to avoid CORS issues.
 * Returns array of { role, content, created_at } or empty array if no history.
 */
const BACKEND_URL = 'https://procurement-ai-5fpq.vercel.app'

export async function fetchNegotiationHistory(threadId) {
  try {
    const response = await fetch(`${BACKEND_URL}/api/lyzr-proxy/sessions/${threadId}/history`, {
      method: 'GET',
      headers: { 'accept': 'application/json' }
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (err) {
    console.warn('[NegotiationHistory] fetch failed:', err.message)
    return []
  }
}