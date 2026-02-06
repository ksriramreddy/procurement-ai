import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ExternalLink, Building2, Globe, CheckCircle, Send } from 'lucide-react'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { SkeletonTableRow } from '../ui/Skeleton'

export default function VendorTable({
  internalVendors = [],
  externalVendors = [],
  onSelectVendor,
  onSendRfq,
  isLoading = false
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [activeTab, setActiveTab] = useState('internal')
  const [selectedForRfq, setSelectedForRfq] = useState(null)

  // Auto-switch to external tab if only external vendors exist
  useEffect(() => {
    if (externalVendors.length > 0 && internalVendors.length === 0) {
      setActiveTab('external')
    }
  }, [externalVendors.length, internalVendors.length])

  const allVendors = useMemo(() => {
    const internal = internalVendors.map(v => ({ ...v, source: 'internal' }))
    const external = externalVendors.map(v => ({
      id: v.name,
      name: v.name,
      type: 'External',
      status: 'Available',
      headquarters: v.headquarters || 'N/A',
      categories: v.services || [],
      complianceScore: v.complianceScore,
      complianceRating: v.complianceRating,
      website: v.website,
      description: v.description,
      source: 'external'
    }))

    return activeTab === 'internal' ? internal : external
  }, [internalVendors, externalVendors, activeTab])

  const filteredVendors = useMemo(() => {
    return allVendors.filter(vendor => {
      const matchesSearch = !searchQuery ||
        vendor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.id?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'All' ||
        vendor.status?.toLowerCase() === statusFilter.toLowerCase()

      return matchesSearch && matchesStatus
    })
  }, [allVendors, searchQuery, statusFilter])

  const getRiskBadgeVariant = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'success'
      case 'medium': return 'warning'
      case 'high': return 'error'
      default: return 'default'
    }
  }

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'onboarded': return 'success'
      case 'approved': return 'info'
      case 'awaiting interview':
      case 'pending': return 'warning'
      default: return 'default'
    }
  }

  const handleSelectForRfq = (e, vendor) => {
    e.stopPropagation()
    setSelectedForRfq(prev =>
      prev?.id === vendor.id && prev?.name === vendor.name ? null : vendor
    )
  }

  const isVendorSelected = (vendor) => {
    if (!selectedForRfq) return false
    return selectedForRfq.id === vendor.id && selectedForRfq.name === vendor.name
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="px-4 pt-4 flex gap-2">
        <button
          onClick={() => setActiveTab('internal')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${activeTab === 'internal'
              ? 'bg-lyzr-ferra text-white'
              : 'bg-lyzr-light-2 text-lyzr-congo hover:bg-lyzr-cream'
            }`}
        >
          <Building2 className="w-4 h-4 inline-block mr-2" />
          Internal ({internalVendors.length})
        </button>
        <button
          onClick={() => setActiveTab('external')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${activeTab === 'external'
              ? 'bg-lyzr-ferra text-white'
              : 'bg-lyzr-light-2 text-lyzr-congo hover:bg-lyzr-cream'
            }`}
        >
          <Globe className="w-4 h-4 inline-block mr-2" />
          External ({externalVendors.length})
        </button>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 flex items-center gap-3 border-b border-lyzr-cream">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lyzr-mid-4" />
          <input
            type="text"
            placeholder="Search by name or ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-lyzr-light-1 border border-transparent rounded-lg text-sm
              placeholder-lyzr-mid-4 focus:outline-none focus:border-lyzr-cream"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-lyzr-light-1 border border-transparent rounded-lg text-sm
            text-lyzr-congo focus:outline-none focus:border-lyzr-cream"
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Onboarded">Onboarded</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-lyzr-light-1 sticky top-0">
            <tr>
              <th className="px-3 py-3 w-10"></th>
              <th className="px-4 py-3 text-left font-medium text-lyzr-mid-4">SUPPLIER</th>
              <th className="px-4 py-3 text-left font-medium text-lyzr-mid-4">STATUS</th>
              <th className="px-4 py-3 text-left font-medium text-lyzr-mid-4">CATEGORY</th>
              <th className="px-4 py-3 text-left font-medium text-lyzr-mid-4">COUNTRY</th>
              <th className="px-4 py-3 text-left font-medium text-lyzr-mid-4">RISK</th>
              <th className="px-4 py-3 text-left font-medium text-lyzr-mid-4">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-lyzr-light-2">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <SkeletonTableRow key={i} columns={7} />
              ))
            ) : filteredVendors.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-lyzr-mid-4">
                  No vendors found
                </td>
              </tr>
            ) : (
              filteredVendors.map((vendor, index) => {
                const selected = isVendorSelected(vendor)
                return (
                  <motion.tr
                    key={vendor.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`cursor-pointer transition-colors ${
                      selected
                        ? 'bg-lyzr-ferra/5 hover:bg-lyzr-ferra/10'
                        : 'hover:bg-lyzr-light-1'
                    }`}
                    onClick={() => onSelectVendor?.(vendor)}
                  >
                    {/* Selection checkbox */}
                    <td className="px-3 py-3">
                      <button
                        onClick={(e) => handleSelectForRfq(e, vendor)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                          selected
                            ? 'bg-lyzr-ferra border-lyzr-ferra'
                            : 'border-lyzr-cream hover:border-lyzr-ferra/50'
                        }`}
                      >
                        {selected && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-lyzr-congo">{vendor.name}</div>
                      {vendor.source === 'external' && vendor.website && (
                        <a
                          href={vendor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-accent-cool hover:underline flex items-center gap-1 mt-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                          {vendor.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusBadgeVariant(vendor.status)}>
                        {vendor.status || 'N/A'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-lyzr-dark-2 truncate max-w-[150px]">
                        {vendor.categories?.slice(0, 2).join(', ') || vendor.type || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-lyzr-dark-2">
                      {vendor.headquarters || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {vendor.riskScore != null ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lyzr-dark-2">{vendor.riskScore}</span>
                          <Badge variant={getRiskBadgeVariant(vendor.riskLevel)} size="sm">
                            {vendor.riskLevel}
                          </Badge>
                        </div>
                      ) : vendor.complianceRating ? (
                        <Badge variant="info" size="sm">{vendor.complianceRating}</Badge>
                      ) : (
                        <span className="text-lyzr-mid-4">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectVendor?.(vendor)
                        }}
                        className="text-accent-cool hover:underline text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </motion.tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Send RFQ Button - appears when a vendor is selected */}
      <AnimatePresence>
        {selectedForRfq && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-lyzr-cream bg-white overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-accent-success" />
                <span className="text-sm text-lyzr-congo">
                  Selected: <strong>{selectedForRfq.name}</strong>
                </span>
              </div>
              <Button
                variant="primary"
                className="w-full"
                onClick={() => onSendRfq?.(selectedForRfq)}
              >
                <Send className="w-4 h-4" />
                Send RFQ
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}