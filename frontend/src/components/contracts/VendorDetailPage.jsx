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
  CheckCircle2,
  Building,
  Zap,
  TrendingDown,
  BarChart3
} from 'lucide-react'
import Badge from '../ui/Badge'
import backendApi from '../../services/backendApi'

export default function VendorDetailPage({ vendorId, onBack }) {
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
      const response = await backendApi.get(
        `/api/internal-vendors/by-vendor-id/${encodeURIComponent(vendorId)}`
      )
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
        className="h-full flex flex-col items-center justify-center bg-white"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-lyzr-ferra mx-auto mb-4"></div>
          <p className="text-lyzr-mid-4 text-lg">Loading vendor details...</p>
        </div>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex flex-col bg-white"
      >
        <button
          onClick={onBack}
          className="px-6 py-4 border-b border-lyzr-cream flex items-center gap-2 text-lyzr-congo hover:bg-lyzr-light-1 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Contracts
        </button>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="text-center bg-lyzr-light-1 rounded-lg p-8 border border-lyzr-cream max-w-md">
            <AlertCircle className="w-16 h-16 text-lyzr-mid-4 mx-auto mb-4" />
            <p className="text-lyzr-congo font-medium mb-2 text-lg">Unable to Load Data</p>
            <p className="text-lyzr-mid-4 mb-4">{error}</p>
            <button
              onClick={fetchVendorDetails}
              className="px-6 py-2 bg-lyzr-ferra text-white rounded-lg hover:bg-lyzr-congo transition-colors font-medium"
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
        className="h-full flex flex-col bg-white"
      >
        <button
          onClick={onBack}
          className="px-6 py-4 border-b border-lyzr-cream flex items-center gap-2 text-lyzr-congo hover:bg-lyzr-light-1 transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Contracts
        </button>
        <div className="flex-1 flex items-center justify-center px-6">
          <p className="text-center text-lyzr-mid-4 text-lg">No vendor found</p>
        </div>
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
  const vs = vendor.vendor_summary || {}
  const meta = vendor.metadata || {}

  const isPlaceholder = vp.status === 'Data Not Available'

  const getRiskColor = (riskLevel) => {
    if (!riskLevel) return 'bg-white'
    const level = riskLevel.toLowerCase()
    if (level === 'low') return 'bg-white'
    if (level === 'medium') return 'bg-white'
    if (level === 'high') return 'bg-white'
    return 'bg-white'
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col bg-white">
      {/* Sticky Header with Back Button */}
      <div className="sticky top-0 z-50 bg-white border-b border-lyzr-cream px-6 py-4 flex items-center justify-between shadow-sm">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-lyzr-congo hover:bg-lyzr-light-1 rounded-lg transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Contracts
        </button>
        <h1 className="font-playfair text-2xl font-semibold text-lyzr-congo">Vendor Profile</h1>
        <div className="w-32"></div>
      </div>

      {isPlaceholder ? (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="bg-lyzr-light-1 border border-lyzr-cream rounded-xl p-12 text-center max-w-md">
            <AlertCircle className="w-16 h-16 text-lyzr-mid-4 mx-auto mb-4" />
            <h3 className="font-semibold text-lyzr-congo mb-2 text-xl">Vendor Data Not Available</h3>
            <p className="text-sm text-lyzr-mid-4 mb-3">
              Detailed vendor information for <strong>{vendorId}</strong> is not available in the system.
            </p>
            <p className="text-xs text-lyzr-mid-3">
              This vendor may need to be added to the internal vendor database or synced from an external source.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Vendor Profile Hero Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-lyzr-light-1 border border-lyzr-cream rounded-xl p-8 shadow-sm"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-playfair text-3xl font-semibold mb-2 text-lyzr-congo">{vp.vendor_name}</h2>
                <p className="text-lyzr-mid-4 text-lg mb-4">{vp.vendor_type}</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <Badge variant="success">{vp.status}</Badge>
                  {vs.preferred_vendor_status && (
                    <Badge variant="status-active">
                      Preferred Vendor
                    </Badge>
                  )}
                  {vs.eligible_for_future_rfqs && (
                    <Badge variant="info">
                      Eligible for RFQs
                    </Badge>
                  )}
                </div>
              </div>
              {vp.website && (
                <a
                  href={vp.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white text-lyzr-congo border border-lyzr-cream rounded-lg hover:bg-lyzr-light-1 transition-colors font-medium"
                >
                  <Globe className="w-5 h-5" />
                  Visit Website
                </a>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-lyzr-cream">
              {vp.vendor_id && (
                <div>
                  <p className="text-lyzr-mid-4 text-sm mb-1 font-medium">Vendor ID</p>
                  <p className="text-lg font-semibold text-lyzr-congo">{vp.vendor_id}</p>
                </div>
              )}
              {vp.founded_year && (
                <div>
                  <p className="text-lyzr-mid-4 text-sm mb-1 font-medium">Founded</p>
                  <p className="text-lg font-semibold text-lyzr-congo">{vp.founded_year}</p>
                </div>
              )}
              {fs.total_revenue_from_procurements && (
                <div>
                  <p className="text-lyzr-mid-4 text-sm mb-1 font-medium">Total Revenue</p>
                  <p className="text-lg font-semibold text-lyzr-congo">
                    ${(fs.total_revenue_from_procurements / 1000000).toFixed(1)}M
                  </p>
                </div>
              )}
              {pm.customer_satisfaction_score !== undefined && (
                <div>
                  <p className="text-lyzr-mid-4 text-sm mb-1 font-medium">Satisfaction</p>
                  <p className="text-lg font-semibold text-lyzr-congo">{pm.customer_satisfaction_score}/5.0 ⭐</p>
                </div>
              )}
            </div>

            {vs.notes && (
              <div className="mt-6 pt-6 border-t border-lyzr-cream">
                <p className="text-sm text-lyzr-mid-4 italic">"{vs.notes}"</p>
              </div>
            )}
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Contact & Services */}
            <div className="lg:col-span-1 space-y-6">
              {/* Contact Section */}
              {vp.contact_details && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-lyzr-cream"
                >
                  <h3 className="font-semibold text-lg text-lyzr-congo mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-lyzr-ferra" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    {vp.contact_details.primary_contact_name && (
                      <div>
                        <p className="text-xs text-lyzr-mid-4 font-medium mb-1">Primary Contact</p>
                        <p className="text-sm font-semibold text-lyzr-congo">
                          {vp.contact_details.primary_contact_name}
                        </p>
                      </div>
                    )}
                    {vp.contact_details.contact_email && (
                      <div>
                        <p className="text-xs text-lyzr-mid-4 font-medium mb-1">Email</p>
                        <a
                          href={`mailto:${vp.contact_details.contact_email}`}
                          className="text-sm text-accent-cool hover:underline font-medium flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          {vp.contact_details.contact_email}
                        </a>
                      </div>
                    )}
                    {vp.contact_details.contact_phone && (
                      <div>
                        <p className="text-xs text-lyzr-mid-4 font-medium mb-1">Phone</p>
                        <a
                          href={`tel:${vp.contact_details.contact_phone}`}
                          className="text-sm text-accent-cool hover:underline font-medium flex items-center gap-2"
                        >
                          <Phone className="w-4 h-4" />
                          {vp.contact_details.contact_phone}
                        </a>
                      </div>
                    )}
                    {vp.contact_details.support_email && (
                      <div>
                        <p className="text-xs text-lyzr-mid-4 font-medium mb-1">Support Email</p>
                        <a
                          href={`mailto:${vp.contact_details.support_email}`}
                          className="text-sm text-accent-cool hover:underline font-medium flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          {vp.contact_details.support_email}
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Headquarters */}
              {vp.headquarters?.address && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-lyzr-cream"
                >
                  <h3 className="font-semibold text-lg text-lyzr-congo mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-lyzr-ferra" />
                    Headquarters
                  </h3>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-lyzr-congo">{vp.headquarters.address}</p>
                    {vp.headquarters.country && (
                      <p className="text-sm text-lyzr-mid-4">{vp.headquarters.country}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Middle & Right Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Services Section */}
              {so.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-lyzr-cream"
                >
                  <h3 className="font-semibold text-lg text-lyzr-congo mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-lyzr-ferra" />
                    Services Offered
                  </h3>
                  <div className="space-y-3">
                    {so.map((service, idx) => (
                      <div key={idx} className="bg-lyzr-light-1 rounded-lg p-4">
                        <p className="text-sm font-semibold text-lyzr-congo mb-2">
                          {service.service_category}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {service.services?.map((s, i) => (
                            <Badge key={i} variant="info" size="sm">
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Certifications Section */}
              {(cc.certifications?.length > 0 || cc.regulatory_coverage?.length > 0) && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-lyzr-cream"
                >
                  <h3 className="font-semibold text-lg text-lyzr-congo mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-lyzr-ferra" />
                    Certifications & Compliance
                  </h3>
                  <div className="space-y-4">
                    {cc.certifications?.length > 0 && (
                      <div>
                        <p className="text-xs text-lyzr-mid-4 font-medium mb-2">Certifications</p>
                        <div className="flex flex-wrap gap-2">
                          {cc.certifications.map((cert, i) => (
                            <Badge key={i} variant="success" size="sm" className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {cc.regulatory_coverage?.length > 0 && (
                      <div>
                        <p className="text-xs text-lyzr-mid-4 font-medium mb-2">Regulatory Coverage</p>
                        <div className="flex flex-wrap gap-2">
                          {cc.regulatory_coverage.map((reg, i) => (
                            <Badge key={i} variant="info" size="sm">
                              {reg}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {cc.last_audit_date && (
                      <div className="pt-3 border-t border-lyzr-cream">
                        <p className="text-xs text-lyzr-mid-4">
                          Last Audit: <span className="font-semibold">{new Date(cc.last_audit_date).toLocaleDateString()}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Commercial Details */}
              {Object.keys(cd).length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-lyzr-cream"
                >
                  <h3 className="font-semibold text-lg text-lyzr-congo mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-lyzr-ferra" />
                    Commercial Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {cd.average_contract_value_usd && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4">
                        <p className="text-xs text-lyzr-mid-4 mb-1 font-medium">Average Contract Value</p>
                        <p className="text-lg font-semibold text-lyzr-congo">
                          ${(cd.average_contract_value_usd / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    )}
                    {cd.minimum_contract_value_usd && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4">
                        <p className="text-xs text-lyzr-mid-4 mb-1 font-medium">Minimum Value</p>
                        <p className="text-lg font-semibold text-lyzr-congo">
                          ${(cd.minimum_contract_value_usd / 1000).toFixed(0)}K
                        </p>
                      </div>
                    )}
                    {cd.maximum_contract_value_usd && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4">
                        <p className="text-xs text-lyzr-mid-4 mb-1 font-medium">Maximum Value</p>
                        <p className="text-lg font-semibold text-lyzr-congo">
                          ${(cd.maximum_contract_value_usd / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    )}
                    {cd.pricing_models?.length > 0 && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4">
                        <p className="text-xs text-lyzr-mid-4 mb-1 font-medium">Pricing Model</p>
                        <p className="text-sm font-semibold text-lyzr-congo">{cd.pricing_models.join(', ')}</p>
                      </div>
                    )}
                    {cd.supported_currencies?.length > 0 && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4 col-span-2">
                        <p className="text-xs text-lyzr-mid-4 mb-1 font-medium">Supported Currencies</p>
                        <p className="text-sm font-semibold text-lyzr-congo">{cd.supported_currencies.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Procurement Engagements */}
              {Object.keys(pe).length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-lyzr-cream"
                >
                  <h3 className="font-semibold text-lg text-lyzr-congo mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-lyzr-ferra" />
                    Procurement Engagements
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {pe.total_rfqs_received !== undefined && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-lyzr-ferra mb-1">{pe.total_rfqs_received}</p>
                        <p className="text-xs text-lyzr-mid-4">Total RFQs</p>
                      </div>
                    )}
                    {pe.active_contracts !== undefined && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-green-600 mb-1">{pe.active_contracts}</p>
                        <p className="text-xs text-lyzr-mid-4">Active Contracts</p>
                      </div>
                    )}
                    {pe.rfq_outcomes?.awarded !== undefined && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-blue-600 mb-1">{pe.rfq_outcomes.awarded}</p>
                        <p className="text-xs text-lyzr-mid-4">RFQs Awarded</p>
                      </div>
                    )}
                    {pe.rfq_outcomes?.rejected !== undefined && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-red-600 mb-1">{pe.rfq_outcomes.rejected}</p>
                        <p className="text-xs text-lyzr-mid-4">RFQs Rejected</p>
                      </div>
                    )}
                    {pe.inactive_contracts !== undefined && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-gray-600 mb-1">{pe.inactive_contracts}</p>
                        <p className="text-xs text-lyzr-mid-4">Inactive</p>
                      </div>
                    )}
                    {pe.rfq_outcomes?.under_review !== undefined && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4 text-center">
                        <p className="text-2xl font-bold text-yellow-600 mb-1">{pe.rfq_outcomes.under_review}</p>
                        <p className="text-xs text-lyzr-mid-4">Under Review</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Performance Metrics */}
              {Object.keys(pm).length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-lyzr-cream"
                >
                  <h3 className="font-semibold text-lg text-lyzr-congo mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-lyzr-ferra" />
                    Performance Metrics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {pm.average_sla_uptime_percent !== undefined && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4">
                        <p className="text-xs text-lyzr-mid-4 font-medium mb-1">SLA Uptime</p>
                        <p className="text-2xl font-bold text-lyzr-congo">{pm.average_sla_uptime_percent}%</p>
                        <div className="text-xs text-lyzr-mid-3 mt-1">
                          <CheckCircle2 className="inline w-3 h-3 mr-1" />
                          Excellent
                        </div>
                      </div>
                    )}
                    {pm.customer_satisfaction_score !== undefined && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4">
                        <p className="text-xs text-lyzr-mid-4 font-medium mb-1">Customer Satisfaction</p>
                        <p className="text-2xl font-bold text-lyzr-congo">{pm.customer_satisfaction_score}/5.0</p>
                        <div className="text-sm mt-1">{"⭐".repeat(Math.round(pm.customer_satisfaction_score))}</div>
                      </div>
                    )}
                    {pm.average_response_time_minutes !== undefined && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4">
                        <p className="text-xs text-lyzr-mid-4 font-medium mb-1">Avg Response Time</p>
                        <p className="text-2xl font-bold text-lyzr-congo">{pm.average_response_time_minutes}m</p>
                        <div className="text-xs text-lyzr-mid-3 mt-1">Quick response</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Risk & Compliance */}
              {Object.keys(rcs).length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-lyzr-cream"
                >
                  <h3 className="font-semibold text-lg text-lyzr-congo mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-lyzr-ferra" />
                    Risk & Compliance Scores
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {rcs.risk_score !== undefined && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4">
                        <p className="text-xs text-lyzr-mid-4 font-medium mb-2">Risk Score</p>
                        <div className="flex items-end gap-2">
                          <p className="text-2xl font-bold text-lyzr-congo">{rcs.risk_score}</p>
                          <span className="text-xs text-lyzr-mid-4 mb-1">/100</span>
                        </div>
                      </div>
                    )}
                    {rcs.compliance_score !== undefined && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4">
                        <p className="text-xs text-lyzr-mid-4 font-medium mb-2">Compliance Score</p>
                        <div className="flex items-end gap-2">
                          <p className="text-2xl font-bold text-lyzr-congo">{rcs.compliance_score}%</p>
                          <CheckCircle2 className="w-5 h-5 text-lyzr-ferra mb-1" />
                        </div>
                      </div>
                    )}
                    {rcs.risk_level && (
                      <div className="bg-lyzr-light-1 rounded-lg p-4">
                        <p className="text-xs text-lyzr-mid-4 font-medium mb-2">Risk Level</p>
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
                      </div>
                    )}
                  </div>
                  {rcs.last_reviewed && (
                    <p className="text-xs text-lyzr-mid-4 mt-4 pt-4 border-t border-lyzr-cream">
                      Last Reviewed: {new Date(rcs.last_reviewed).toLocaleDateString()}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Financial Summary */}
              {Object.keys(fs).length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-lyzr-cream"
                >
                  <h3 className="font-semibold text-lg text-lyzr-congo mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-lyzr-ferra" />
                    Financial Summary
                  </h3>
                  <div className="space-y-3">
                    {fs.total_revenue_from_procurements && (
                      <div className="flex justify-between items-center p-3 bg-lyzr-light-1 rounded-lg">
                        <p className="text-sm font-medium text-lyzr-congo">Total Revenue</p>
                        <p className="text-sm font-bold text-lyzr-congo">
                          ${(fs.total_revenue_from_procurements / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    )}
                    {fs.annual_recurring_revenue && (
                      <div className="flex justify-between items-center p-3 bg-lyzr-light-1 rounded-lg">
                        <p className="text-sm font-medium text-lyzr-congo">Annual Recurring Revenue</p>
                        <p className="text-sm font-bold text-lyzr-congo">
                          ${(fs.annual_recurring_revenue / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    )}
                    {fs.largest_single_contract_value && (
                      <div className="flex justify-between items-center p-3 bg-lyzr-light-1 rounded-lg">
                        <p className="text-sm font-medium text-lyzr-congo">Largest Contract</p>
                        <p className="text-sm font-bold text-lyzr-congo">
                          ${(fs.largest_single_contract_value / 1000000).toFixed(1)}M
                        </p>
                      </div>
                    )}
                    {fs.currency && (
                      <p className="text-xs text-lyzr-mid-4 pt-2 border-t border-lyzr-cream">
                        Currency: <span className="font-semibold">{fs.currency}</span>
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Metadata */}
              {(meta.record_created_at || meta.last_updated_at) && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="bg-lyzr-light-1 rounded-xl p-4 text-xs text-lyzr-mid-4"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    {meta.record_created_at && (
                      <div>
                        <p className="font-medium">Created:</p>
                        <p>{new Date(meta.record_created_at).toLocaleDateString()}</p>
                      </div>
                    )}
                    {meta.last_updated_at && (
                      <div>
                        <p className="font-medium">Last Updated:</p>
                        <p>{new Date(meta.last_updated_at).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}
    </motion.div>
  )
}