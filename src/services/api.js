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

  // Try to parse as JSON
  try {
    return JSON.parse(responseStr)
  } catch {
    // Return original response if not JSON
    return { response: responseStr }
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
  console.log('📝 RFQ generator raw response received')

  // Parse the response - it's a JSON string with { from, content }
  const parsed = extractFinalJSON(data)
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

    const data = await response.json()
    console.log('💰 Pricing agent response received')

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
