const CHAT_URL = 'https://agent-prod.studio.lyzr.ai/v3/inference/chat/'
const ASSET_UPLOAD_URL = 'https://agent-prod.studio.lyzr.ai/v3/assets/upload'

/**
 * Get environment variables
 */
function getConfig() {
  return {
    apiKey: import.meta.env.VITE_LYZR_API_KEY || 'sk-default-IjvgrZDhiW1wm1ydxpuKPEJrmcqxsx35',
    userId: import.meta.env.VITE_LYZR_USER_ID || 'sriram@lyzr.ai',
    agentId: import.meta.env.VITE_LYZR_AGENT_ID || '698468a43107974e70311aaf'
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
  
  console.log('⬆️ Uploading asset:', file.name)
  
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
    console.log('✅ Upload response:', JSON.stringify(data, null, 2))
    
    // Extract asset_id from response
    const result = data.results?.[0]
    
    if (!result || !result.success || !result.asset_id) {
      throw new Error(`Asset upload failed: ${result?.error || 'Unknown error'}`)
    }
    
    const assetId = result.asset_id
    console.log('🆔 Asset ID:', assetId)
    
    return assetId
  } catch (error) {
    console.error('❌ Failed to upload asset:', error)
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

  console.log('\n')
  console.log('┌──────────────────────────────────────────────────────────────┐')
  console.log('│                  LYZR API REQUEST                             │')
  console.log('├──────────────────────────────────────────────────────────────┤')
  console.log('│ URL:', CHAT_URL)
  console.log('│ User ID:', config.userId)
  console.log('│ Agent ID:', config.agentId)
  console.log('│ Session ID:', sessionId)
  console.log('├──────────────────────────────────────────────────────────────┤')
  console.log('│ REQUEST BODY:')
  console.log('└──────────────────────────────────────────────────────────────┘')
  console.log(JSON.stringify(requestBody, null, 2))
  console.log('\n')

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

    console.log('\n')
    console.log('┌──────────────────────────────────────────────────────────────┐')
    console.log('│                  RAW LYZR API RESPONSE                        │')
    console.log('├──────────────────────────────────────────────────────────────┤')
    console.log('│ Status: SUCCESS')
    console.log('└──────────────────────────────────────────────────────────────┘')
    console.log(JSON.stringify(data, null, 2))
    console.log('\n')

    const extracted = extractFinalJSON(data)

    console.log('┌──────────────────────────────────────────────────────────────┐')
    console.log('│                  EXTRACTED/PARSED RESPONSE                    │')
    console.log('└──────────────────────────────────────────────────────────────┘')
    console.log(JSON.stringify(extracted, null, 2))
    console.log('\n')

    return extracted
  } catch (error) {
    console.error('❌ Failed to send message:', error)
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
        console.log('🔧 extractFieldsManually: extracted from=' + from + ', content length=' + content.length)
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
  const RFQ_AGENT_ID = '698311d86738a8c0ed88d471'
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
    response_deadline: rfqFormData.response_deadline || ''
  }

  const requestBody = {
    user_id: config.userId,
    agent_id: RFQ_AGENT_ID,
    session_id: sessionId,
    message: JSON.stringify(messagePayload)
  }

  console.log('📝 Generating RFQ document...')
  console.log('Agent ID:', RFQ_AGENT_ID)
  console.log('Payload:', JSON.stringify(messagePayload, null, 2))

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
  console.log('📝 RFQ generator raw response received:', data)
  
  const parsed = extractFinalJSON(data)
  console.log('📝 Parsed RFQ document response:', parsed)
  return parsed
}

/**
 * Generate RFP document by calling the RFP document generator agent
 * @param {object} rfpFormData - The RFP form data
 * @returns {Promise<object>} - { from, content, message } where content is the full RFP document
 */
export async function generateRfpDocument(rfpFormData) {
  const config = getConfig()
  const RFP_AGENT_ID = '698b5e2c6aa3f8e8896cc8d5'
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
    contact_channel: rfpFormData.contact_channel || ''
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

  console.log('📄 Generating RFP document...')
  console.log('Agent ID:', RFP_AGENT_ID)
  console.log('Payload:', JSON.stringify(rfpInput, null, 2))

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
  console.log('📄 RFP generator raw response received:', data)

  const parsed = extractFinalJSON(data)
  console.log('📄 Parsed RFP document response:', parsed)
  return parsed
}

/**
 * Call pricing suggestion agent to get AI-suggested pricing for procurement
 * @param {object} procurementDetails - The procurement details (quantity, type, etc.)
 * @returns {Promise<object>} - { from: 'ai_price_suggestion', price: <number> }
 */
export async function callPricingSuggestionAgent(procurementDetails) {
  const config = getConfig()
  const PRICING_AGENT_ID = '6985810b0ee88347863f06fa'
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

  console.log('💰 Calling pricing suggestion agent...')
  console.log('Agent ID:', PRICING_AGENT_ID)
  console.log('Payload:', JSON.stringify(messagePayload, null, 2))

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
    // console.log('💰 Pricing agent response received status:', await response.json())
    const data = await response.json()

    console.log('💰 Pricing agent response received',data)

    // Parse the response
    const parsed = extractFinalJSON(data)
    console.log('💰 Parsed pricing response:', parsed)
    return parsed
  } catch (error) {
    console.error('❌ Failed to get pricing suggestion:', error)
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
  const VENDOR_ANALYSIS_AGENT_ID = '69859edfe17e33c11eed1af8'
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

  console.log('🔍 Calling vendor analysis agent...')
  console.log('Agent ID:', VENDOR_ANALYSIS_AGENT_ID)
  console.log('Vendor:', vendorInfo.name)
  console.log('Payload:', JSON.stringify(messagePayload, null, 2))

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
    console.log('🔍 Vendor analysis agent response received')

    // Parse the response
    const parsed = extractFinalJSON(data)
    console.log('🔍 Parsed vendor analysis:', JSON.stringify(parsed, null, 2))
    return parsed
  } catch (error) {
    console.error('❌ Failed to get vendor analysis:', error)
    throw error
  }
}