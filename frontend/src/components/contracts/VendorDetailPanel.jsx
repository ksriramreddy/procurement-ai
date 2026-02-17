import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  AlertCircle,
  MapPin,
  Mail,
  Phone,
  Globe,
  ShieldCheck,
  TrendingUp,
  Award,
  Users,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle2
} from 'lucide-react'
import Badge from '../ui/Badge'
import backendApi from '../../services/backendApi'

export default function VendorDetailPanel({ vendorId, contractId, onBack }) {
  const [vendor, setVendor] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchVendorDetails()
  }, [vendorId])

  const fetchVendorDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await backendApi.get(`/api/vendors/by-vendor-id/${encodeURIComponent(vendorId)}`)
      setVendor(response.data)
    } catch (err) {
      console.error('Failed to fetch vendor:', err)
      setError(err.message || 'Failed to fetch vendor details')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full bg-white flex items-center justify-center"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lyzr-ferra mx-auto mb-4"></div>
          <p className="text-lyzr-mid-4">Loading vendor details...</p>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full bg-white p-6 flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-playfair text-xl font-semibold text-lyzr-congo">Vendor Details</h2>
          <button
            onClick={onBack}
            className="p-2 hover:bg-lyzr-light-1 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-lyzr-congo" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <button
              onClick={fetchVendorDetails}
              className="mt-4 px-4 py-2 bg-lyzr-ferra text-white rounded-lg hover:bg-lyzr-congo transition-colors text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  if (!vendor) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full bg-white p-6 flex flex-col"
      >
        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-lyzr-congo hover:text-lyzr-ferra transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <p className="text-center text-lyzr-mid-4">No vendor found</p>
      </motion.div>
    )
  }

  const vp = vendor.vendor_profile || {}
  const so = vendor.services_offered || []
  const cc = vendor.certifications_and_compliance || {}
  const cd = vendor.commercial_details || {}
  const pe = vendor.procurement_engagements || {}
  const pm = vendor.performance_metrics || {}
  const rcs = vendor.risk_and_compliance_scores || {}
  const fs = vendor.financial_summary || {}

  const isPlaceholder = vp.status === "Data Not Available"

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full bg-white flex flex-col overflow-hidden"
    >
      {/* Header with Back Button */}
      <div className="px-6 py-4 border-b border-lyzr-cream bg-lyzr-light-1 flex items-center justify-between">
        <h2 className="font-playfair text-xl font-semibold text-lyzr-congo">Vendor Details</h2>
        <button
          onClick={onBack}
          className="p-2 hover:bg-white rounded-lg transition-colors"
          title="Back to contracts"
        >
          <ArrowLeft className="w-5 h-5 text-lyzr-congo" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {isPlaceholder ? (
          <div className="px-6 py-12 flex items-center justify-center h-full">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center max-w-sm">
              <AlertCircle className="w-14 h-14 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold text-blue-900 mb-2 text-lg">Vendor Data Not Available</h3>
              <p className="text-sm text-blue-700 mb-3">
                Detailed vendor information for <strong>{vendorId}</strong> is not available in the system yet.
              </p>
              <p className="text-xs text-blue-600">
                This vendor may need to be added to the vendor management system or data may be synced separately.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Vendor Profile Section */}
            <div className="px-6 py-6 border-b border-lyzr-cream">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-playfair text-2xl font-semibold text-lyzr-congo mb-2">
                    {vp.vendor_name}
                  </h3>
                  <p className="text-sm text-lyzr-mid-4 mb-3">{vp.vendor_type}</p>
                  <Badge variant={vp.status === 'Active' ? 'success' : 'warning'}>
                    {vp.status}
                  </Badge>
                </div>
                {vp.website && (
                  <a
                    href={vp.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-cool hover:underline flex items-center gap-1"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Key Info Grid */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {vp.vendor_id && (
                  <div className="bg-lyzr-light-1 rounded-lg p-3">
                    <p className="text-xs text-lyzr-mid-4 mb-1">Vendor ID</p>
                    <p className="text-sm font-medium text-lyzr-congo">{vp.vendor_id}</p>
                  </div>
                )}
                {vp.founded_year && (
                  <div className="bg-lyzr-light-1 rounded-lg p-3">
                    <p className="text-xs text-lyzr-mid-4 mb-1">Founded</p>
                    <p className="text-sm font-medium text-lyzr-congo">{vp.founded_year}</p>
                  </div>
                )}
                {vp.headquarters?.address && (
                  <div className="bg-lyzr-light-1 rounded-lg p-3 col-span-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-lyzr-mid-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-lyzr-mid-4">Headquarters</p>
                        <p className="text-sm font-medium text-lyzr-congo">{vp.headquarters.address}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Details Section */}
            {vp.contact_details && (
              <div className="px-6 py-6 border-b border-lyzr-cream">
                <h4 className="font-semibold text-lyzr-congo mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Contact Information
                </h4>
                <div className="space-y-3">
                  {vp.contact_details.primary_contact_name && (
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-lyzr-mid-4" />
                      <div>
                        <p className="text-xs text-lyzr-mid-4">Primary Contact</p>
                        <p className="text-sm font-medium text-lyzr-congo">
                          {vp.contact_details.primary_contact_name}
                        </p>
                      </div>
                    </div>
                  )}
                  {vp.contact_details.contact_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-lyzr-mid-4" />
                      <div>
                        <p className="text-xs text-lyzr-mid-4">Email</p>
                        <a
                          href={`mailto:${vp.contact_details.contact_email}`}
                          className="text-sm font-medium text-accent-cool hover:underline"
                        >
                          {vp.contact_details.contact_email}
                        </a>
                      </div>
                    </div>
                  )}
                  {vp.contact_details.contact_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-lyzr-mid-4" />
                      <div>
                        <p className="text-xs text-lyzr-mid-4">Phone</p>
                        <a
                          href={`tel:${vp.contact_details.contact_phone}`}
                          className="text-sm font-medium text-accent-cool hover:underline"
                        >
                          {vp.contact_details.contact_phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {vp.contact_details.support_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-lyzr-mid-4" />
                      <div>
                        <p className="text-xs text-lyzr-mid-4">Support Email</p>
                        <a
                          href={`mailto:${vp.contact_details.support_email}`}
                          className="text-sm font-medium text-accent-cool hover:underline"
                        >
                          {vp.contact_details.support_email}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Services Section */}
            {so.length > 0 && (
              <div className="px-6 py-6 border-b border-lyzr-cream">
                <h4 className="font-semibold text-lyzr-congo mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Services Offered
                </h4>
                <div className="space-y-3">
                  {so.map((service, idx) => (
                    <div key={idx} className="bg-lyzr-light-1 rounded-lg p-3">
                      <p className="text-sm font-medium text-lyzr-congo mb-2">
                        {service.service_category}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {service.services?.map((s, i) => (
                          <Badge key={i} variant="info" size="sm">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications & Compliance */}
            {(cc.certifications?.length > 0 || cc.regulatory_coverage?.length > 0) && (
              <div className="px-6 py-6 border-b border-lyzr-cream">
                <h4 className="font-semibold text-lyzr-congo mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Certifications & Compliance
                </h4>
                {cc.certifications?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-lyzr-mid-4 mb-2">Certifications</p>
                    <div className="flex flex-wrap gap-2">
                      {cc.certifications.map((cert, idx) => (
                        <Badge key={idx} variant="success" size="sm">{cert}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {cc.regulatory_coverage?.length > 0 && (
                  <div>
                    <p className="text-xs text-lyzr-mid-4 mb-2">Regulatory Coverage</p>
                    <div className="flex flex-wrap gap-2">
                      {cc.regulatory_coverage.map((reg, idx) => (
                        <Badge key={idx} variant="info" size="sm">{reg}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {cc.last_audit_date && (
                  <div className="mt-3 text-xs text-lyzr-mid-4">
                    Last Audit: {new Date(cc.last_audit_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}

            {/* Commercial Details */}
            {Object.keys(cd).length > 0 && (
              <div className="px-6 py-6 border-b border-lyzr-cream">
                <h4 className="font-semibold text-lyzr-congo mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Commercial Details
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {cd.average_contract_value_usd && (
                    <div className="bg-lyzr-light-1 rounded-lg p-3">
                      <p className="text-xs text-lyzr-mid-4">Avg Contract Value</p>
                      <p className="text-sm font-medium text-lyzr-congo">
                        ${(cd.average_contract_value_usd / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  )}
                  {cd.minimum_contract_value_usd && (
                    <div className="bg-lyzr-light-1 rounded-lg p-3">
                      <p className="text-xs text-lyzr-mid-4">Min Value</p>
                      <p className="text-sm font-medium text-lyzr-congo">
                        ${(cd.minimum_contract_value_usd / 1000).toFixed(0)}K
                      </p>
                    </div>
                  )}
                  {cd.maximum_contract_value_usd && (
                    <div className="bg-lyzr-light-1 rounded-lg p-3">
                      <p className="text-xs text-lyzr-mid-4">Max Value</p>
                      <p className="text-sm font-medium text-lyzr-congo">
                        ${(cd.maximum_contract_value_usd / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  )}
                  {cd.pricing_models?.length > 0 && (
                    <div className="bg-lyzr-light-1 rounded-lg p-3">
                      <p className="text-xs text-lyzr-mid-4">Pricing Model</p>
                      <p className="text-sm font-medium text-lyzr-congo">{cd.pricing_models[0]}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Procurement Engagements */}
            {Object.keys(pe).length > 0 && (
              <div className="px-6 py-6 border-b border-lyzr-cream">
                <h4 className="font-semibold text-lyzr-congo mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Procurement Engagements
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {pe.total_rfqs_received !== undefined && (
                    <div className="bg-lyzr-light-1 rounded-lg p-3">
                      <p className="text-xs text-lyzr-mid-4">Total RFQs</p>
                      <p className="text-sm font-medium text-lyzr-congo">{pe.total_rfqs_received}</p>
                    </div>
                  )}
                  {pe.active_contracts !== undefined && (
                    <div className="bg-lyzr-light-1 rounded-lg p-3">
                      <p className="text-xs text-lyzr-mid-4">Active Contracts</p>
                      <p className="text-sm font-medium text-lyzr-congo">{pe.active_contracts}</p>
                    </div>
                  )}
                  {pe.rfq_outcomes?.awarded !== undefined && (
                    <div className="bg-lyzr-light-1 rounded-lg p-3">
                      <p className="text-xs text-lyzr-mid-4">RFQs Awarded</p>
                      <p className="text-sm font-medium text-lyzr-congo">{pe.rfq_outcomes.awarded}</p>
                    </div>
                  )}
                  {pe.rfq_outcomes?.rejected !== undefined && (
                    <div className="bg-lyzr-light-1 rounded-lg p-3">
                      <p className="text-xs text-lyzr-mid-4">RFQs Rejected</p>
                      <p className="text-sm font-medium text-lyzr-congo">{pe.rfq_outcomes.rejected}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {Object.keys(pm).length > 0 && (
              <div className="px-6 py-6 border-b border-lyzr-cream">
                <h4 className="font-semibold text-lyzr-congo mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Performance Metrics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {pm.average_sla_uptime_percent !== undefined && (
                    <div className="bg-lyzr-light-1 rounded-lg p-3">
                      <p className="text-xs text-lyzr-mid-4">SLA Uptime</p>
                      <p className="text-sm font-medium text-lyzr-congo">{pm.average_sla_uptime_percent}%</p>
                    </div>
                  )}
                  {pm.customer_satisfaction_score !== undefined && (
                    <div className="bg-lyzr-light-1 rounded-lg p-3">
                      <p className="text-xs text-lyzr-mid-4">Satisfaction</p>
                      <p className="text-sm font-medium text-lyzr-congo">{pm.customer_satisfaction_score}/5.0</p>
                    </div>
                  )}
                  {pm.average_response_time_minutes !== undefined && (
                    <div className="bg-lyzr-light-1 rounded-lg p-3 col-span-2">
                      <p className="text-xs text-lyzr-mid-4">Avg Response Time</p>
                      <p className="text-sm font-medium text-lyzr-congo">{pm.average_response_time_minutes} min</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Risk & Compliance Scores */}
            {Object.keys(rcs).length > 0 && (
              <div className="px-6 py-6 border-b border-lyzr-cream">
                <h4 className="font-semibold text-lyzr-congo mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Risk & Compliance
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {rcs.risk_score !== undefined && (
                    <div className="bg-lyzr-light-1 rounded-lg p-3">
                      <p className="text-xs text-lyzr-mid-4">Risk Score</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm font-medium text-lyzr-congo">{rcs.risk_score}</p>
                        {rcs.risk_level && (
                          <Badge
                            variant={
                              rcs.risk_level.toLowerCase() === 'low'
                                ? 'success'
                                : rcs.risk_level.toLowerCase() === 'medium'
                                ? 'warning'
                                : 'error'
                            }
                            size="sm"
                          >
                            {rcs.risk_level}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  {rcs.compliance_score !== undefined && (
                    <div className="bg-lyzr-light-1 rounded-lg p-3">
                      <p className="text-xs text-lyzr-mid-4">Compliance Score</p>
                      <p className="text-sm font-medium text-lyzr-congo">{rcs.compliance_score}%</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Financial Summary */}
            {Object.keys(fs).length > 0 && (
              <div className="px-6 py-6">
                <h4 className="font-semibold text-lyzr-congo mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Financial Summary
                </h4>
                <div className="space-y-2">
                  {fs.total_revenue_from_procurements && (
                    <div className="flex justify-between items-center p-3 bg-lyzr-light-1 rounded-lg">
                      <p className="text-sm text-lyzr-mid-4">Total Revenue</p>
                      <p className="text-sm font-medium text-lyzr-congo">
                        ${(fs.total_revenue_from_procurements / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  )}
                  {fs.annual_recurring_revenue && (
                    <div className="flex justify-between items-center p-3 bg-lyzr-light-1 rounded-lg">
                      <p className="text-sm text-lyzr-mid-4">Annual Recurring Revenue</p>
                      <p className="text-sm font-medium text-lyzr-congo">
                        ${(fs.annual_recurring_revenue / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  )}
                  {fs.largest_single_contract_value && (
                    <div className="flex justify-between items-center p-3 bg-lyzr-light-1 rounded-lg">
                      <p className="text-sm text-lyzr-mid-4">Largest Contract</p>
                      <p className="text-sm font-medium text-lyzr-congo">
                        ${(fs.largest_single_contract_value / 1000000).toFixed(1)}M
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}
