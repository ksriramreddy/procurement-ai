import axios from 'axios'

const BACKEND_URL = 'https://procurement-ai-5fpq.vercel.app'

const api = axios.create({
  baseURL: BACKEND_URL,
  headers: { 'Content-Type': 'application/json' }
})

/**
 * Send document (RFQ/RFP) to vendors via backend.
 * Creates vendor records + threads.
 *
 * vendor_id = website URL for both internal & external vendors
 * Internal vendors:  v.website  (from vendor_profile.website)
 * External vendors:  v.website  (from external vendor fetcher)
 */
export async function sendDocumentToVendors({ vendors, documentType, subject, quotedPrice, documentContent, certificationData }) {
  const payload = {
    vendors: vendors.map(v => ({
      vendor_id: v.website || v.contact?.email || v.name || '',
      vendor_name: v.name || '',
      contact_email: v.contact?.email || '',
      contact_name: v.contact?.name || '',
      vendor_type: v.type || '',
      headquarters: v.headquarters || '',
      website: v.website || '',
      source: v.website && v.contact?.email ? 'internal' : 'external'
    })),
    document_type: documentType,
    subject,
    quoted_price: quotedPrice || null,
    document_content: documentContent || null,
    mandatory: certificationData?.mandatory || [],
    good_to_have: certificationData?.good_to_have || [],
    summary: certificationData?.summary || ''
  }
  const { data } = await api.put('/api/send-document/', payload)
  return data
}

/**
 * Get all vendors from backend
 */
export async function fetchAllVendors() {
  const { data } = await api.get('/api/vendors/')
  return data
}

/**
 * Get threads for a specific vendor by vendor_id (website URL as query param)
 */
export async function fetchVendorThreads(vendorId) {
  const { data } = await api.get('/api/email-threads/by-vendor', {
    params: { vendor_id: vendorId }
  })
  return data
}

/**
 * Get messages for a specific thread
 */
export async function fetchThreadMessages(threadId) {
  const { data } = await api.get(`/api/messages/thread/${threadId}`)
  return data
}

/**
 * Upload a file to the backend
 */
export async function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await api.post('/api/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

/**
 * Create a message in a thread
 */
export async function createMessage({ message, threadId, sender = 'vendor', attachment = [] }) {
  const { data } = await api.put('/api/messages/', {
    message,
    thread_id: threadId,
    sender,
    attachment
  })
  return data
}

/**
 * Upload RFQ/RFP document to S3 and save message in MongoDB
 * @param {Blob} fileBlob - The PDF blob
 * @param {string} filename - e.g. "RFQ_2025-02-12.pdf"
 * @param {string} documentType - "RFQ" or "RFP" or "Contract"
 * @param {string} threadId - The thread_id to associate with
 */
export async function uploadDocumentToS3({ fileBlob, filename, documentType, threadId }) {
  const formData = new FormData()
  formData.append('file', fileBlob, filename)
  formData.append('document_type', documentType)
  formData.append('thread_id', threadId)
  const { data } = await api.post('/api/s3-upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

/**
 * Update a certification's is_submitted status in a thread
 * @param {string} threadId - The thread_id
 * @param {string} certificate - Certificate name (e.g. "ISO IEC 27001")
 * @param {string} field - "mandatory" or "good_to_have"
 * @param {string} isSubmitted - Validation status (e.g. "VALID", "NOT_VALID")
 */
export async function updateCertStatus({ threadId, certificate, field, isSubmitted }) {
  const { data } = await api.put('/api/email-threads/cert-status', {
    thread_id: threadId,
    certificate,
    field,
    is_submitted: isSubmitted
  })
  return data
}

/**
 * Get a vendor by its vendor_id field (e.g. "VEND-ALPHACLOUD-007")
 */
export async function fetchVendorByVendorId(vendorId) {
  const { data } = await api.get(`/api/vendors/by-vendor-id/${encodeURIComponent(vendorId)}`)
  return data
}

export default api
