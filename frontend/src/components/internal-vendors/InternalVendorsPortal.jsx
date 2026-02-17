import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Search, Building2, MapPin, Star } from 'lucide-react'
import VendorDetailPage from '../contracts/VendorDetailPage'
import backendApi from '../../services/backendApi'

export default function InternalVendorsPortal({ preSelectedVendorId, onClearPreSelected }) {
  const [vendors, setVendors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVendorId, setSelectedVendorId] = useState(preSelectedVendorId || null)

  // If a pre-selected vendor ID is passed (e.g. from chat vendor link), open it immediately
  useEffect(() => {
    if (preSelectedVendorId) {
      setSelectedVendorId(preSelectedVendorId)
    }
  }, [preSelectedVendorId])

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await backendApi.get('/api/internal-vendors/')
      setVendors(response.data || [])
    } catch (err) {
      console.error('Failed to fetch internal vendors:', err)
      setError(err.message || 'Failed to fetch vendors')
      setVendors([])
    } finally {
      setIsLoading(false)
    }
  }

  // If a vendor is selected, show the vendor detail page
  if (selectedVendorId) {
    return (
      <VendorDetailPage
        vendorId={selectedVendorId}
        onBack={() => {
          setSelectedVendorId(null)
          if (onClearPreSelected) onClearPreSelected()
        }}
      />
    )
  }

  // Filter vendors based on search
  const filteredVendors = vendors.filter((vendor) => {
    const vp = vendor.vendor_profile || {}
    const searchLower = searchQuery.toLowerCase()
    return (
      vp.vendor_name?.toLowerCase().includes(searchLower) ||
      vp.vendor_type?.toLowerCase().includes(searchLower) ||
      vp.vendor_id?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-lyzr-light-1 to-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-lyzr-cream bg-gradient-to-r from-lyzr-congo/5 to-lyzr-ferra/5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-playfair text-2xl font-semibold text-lyzr-congo">Internal Vendors</h1>
            <p className="text-sm text-lyzr-mid-4 mt-1">
              Browse and manage all internal vendors
            </p>
          </div>
          <button
            onClick={fetchVendors}
            disabled={isLoading}
            className="px-4 py-2 bg-lyzr-ferra text-white rounded-lg hover:bg-lyzr-congo 
              disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-lyzr-mid-4" />
          <input
            type="text"
            placeholder="Search by vendor name, type, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-lyzr-cream rounded-lg 
              focus:outline-none focus:ring-2 focus:ring-lyzr-ferra focus:border-transparent
              text-sm bg-lyzr-light-1"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-lyzr-light-1 border border-lyzr-cream rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-lyzr-mid-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-lyzr-congo">{error}</p>
            <button
              onClick={fetchVendors}
              className="text-sm text-lyzr-ferra hover:text-lyzr-congo underline mt-1"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Vendors Grid */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lyzr-ferra mx-auto mb-4"></div>
              <p className="text-lyzr-mid-4">Loading vendors...</p>
            </div>
          </div>
        ) : filteredVendors.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Building2 className="w-12 h-12 text-lyzr-mid-4 mx-auto mb-4" />
              <p className="text-lyzr-mid-4 font-medium">
                {searchQuery ? 'No vendors found' : 'No vendors available'}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVendors.map((vendor, idx) => (
                <VendorCard
                  key={vendor.id || idx}
                  vendor={vendor}
                  onClick={() => setSelectedVendorId(vendor.vendor_profile?.vendor_id || vendor.id)}
                  index={idx}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function VendorCard({ vendor, onClick, index }) {
  const vp = vendor.vendor_profile || {}
  const pm = vendor.performance_metrics || {}
  const rcs = vendor.risk_and_compliance_scores || {}
  const fs = vendor.financial_summary || {}

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={onClick}
      className="bg-gradient-to-br from-white to-lyzr-light-1 border border-lyzr-cream rounded-xl p-6 hover:shadow-xl hover:shadow-lyzr-ferra/10 
        transition-all duration-300 cursor-pointer hover:border-lyzr-ferra group"
    >
      {/* Header */}
      <div className="mb-4 pb-3 border-b border-lyzr-cream/50">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-lyzr-congo group-hover:text-lyzr-ferra 
              transition-colors truncate">
              {vp.vendor_name || 'Unknown Vendor'}
            </h3>
            <p className="text-xs text-lyzr-mid-4 mt-1 truncate">{vp.vendor_type || 'N/A'}</p>
          </div>
          {vp.status && (
            <div className="text-xs px-2.5 py-1 rounded-full bg-lyzr-ferra/15 text-lyzr-ferra 
              font-semibold ml-2 flex-shrink-0 border border-lyzr-ferra/20">
              {vp.status}
            </div>
          )}
        </div>
      </div>

      {/* Location */}
      {vp.headquarters?.address && (
        <div className="flex items-start gap-2 mb-4 p-3 bg-gradient-to-r from-lyzr-ferra/10 to-lyzr-ferra/5 rounded-lg border border-lyzr-ferra/10">
          <MapPin className="w-4 h-4 text-lyzr-ferra flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-lyzr-mid-4 font-semibold">Headquarters</p>
            <p className="text-sm text-lyzr-congo truncate">{vp.headquarters.address}</p>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {fs.total_revenue_from_procurements && (
          <div className="bg-gradient-to-br from-lyzr-congo/8 to-lyzr-congo/3 rounded-lg p-3 border border-lyzr-congo/10">
            <p className="text-xs text-lyzr-congo font-semibold mb-1 opacity-80">Total Revenue</p>
            <p className="text-sm font-bold text-lyzr-congo">
              ${(fs.total_revenue_from_procurements / 1000000).toFixed(1)}M
            </p>
          </div>
        )}
        {pm.customer_satisfaction_score !== undefined && (
          <div className="bg-gradient-to-br from-lyzr-ferra/8 to-lyzr-ferra/3 rounded-lg p-3 border border-lyzr-ferra/10">
            <p className="text-xs text-lyzr-ferra font-semibold mb-1 opacity-80">Satisfaction</p>
            <div className="flex items-center gap-1">
              <p className="text-sm font-bold text-lyzr-congo">
                {pm.customer_satisfaction_score}/5.0
              </p>
              <Star className="w-3 h-3 fill-lyzr-ferra text-lyzr-ferra" />
            </div>
          </div>
        )}
      </div>

      {/* Risk & Compliance */}
      {(rcs.risk_level || rcs.compliance_score !== undefined) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          {rcs.compliance_score !== undefined && (
            <div className="bg-gradient-to-br from-green-100/40 to-green-50/20 rounded-lg p-3 border border-green-200/30">
              <p className="text-xs text-green-700 font-semibold mb-1 opacity-90">Compliance</p>
              <p className="text-sm font-bold text-green-800">{rcs.compliance_score}%</p>
            </div>
          )}
          {rcs.risk_level && (
            <div className="bg-gradient-to-br from-amber-100/40 to-amber-50/20 rounded-lg p-3 border border-amber-200/30">
              <p className="text-xs text-amber-700 font-semibold mb-1 opacity-90">Risk Level</p>
              <p className="text-sm font-bold text-amber-800">{rcs.risk_level}</p>
            </div>
          )}
        </div>
      )}

      {/* Certifications Preview */}
      {vendor.certifications_and_compliance?.certifications?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-lyzr-mid-4 font-medium mb-2">Certifications</p>
          <div className="flex flex-wrap gap-1">
            {vendor.certifications_and_compliance.certifications.slice(0, 2).map((cert, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 bg-lyzr-ferra/10 text-lyzr-ferra rounded 
                  truncate border border-lyzr-ferra/20"
              >
                {cert}
              </span>
            ))}
            {vendor.certifications_and_compliance.certifications.length > 2 && (
              <span className="text-xs px-2 py-1 text-lyzr-mid-4">
                +{vendor.certifications_and_compliance.certifications.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Services Preview */}
      {vendor.services_offered?.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-lyzr-mid-4 font-medium mb-2">Services</p>
          <div className="flex flex-wrap gap-1">
            {vendor.services_offered.slice(0, 2).map((service, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 bg-lyzr-light-1 text-lyzr-congo rounded 
                  truncate"
              >
                {service.service_category}
              </span>
            ))}
            {vendor.services_offered.length > 2 && (
              <span className="text-xs px-2 py-1 text-lyzr-mid-4">
                +{vendor.services_offered.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer - Click to View */}
      <div className="pt-3 border-t border-lyzr-cream">
        <p className="text-xs text-center text-lyzr-ferra font-semibold group-hover:text-lyzr-congo 
          transition-colors opacity-90">
          Click to view details →
        </p>
      </div>
    </motion.div>
  )
}
