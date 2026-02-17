import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FileText, CheckCircle, ChevronDown, X } from 'lucide-react'
import Badge from '../ui/Badge'
import { SkeletonTableRow } from '../ui/Skeleton'

export default function ContractTable({
  contracts = [],
  isLoading = false,
  onContractClick
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [riskFilter, setRiskFilter] = useState('All')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [departmentFilter, setDepartmentFilter] = useState('All')
  const [priceOperator, setPriceOperator] = useState('>=')
  const [priceValue, setPriceValue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const matchesSearch = !searchQuery ||
        contract.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.contract_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contract.service_category?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'All' ||
        contract.contract_status?.toLowerCase() === statusFilter.toLowerCase()

      const matchesRisk = riskFilter === 'All' ||
        contract.risk_level?.toLowerCase() === riskFilter.toLowerCase()

      const matchesDepartment = departmentFilter === 'All' ||
        contract.department?.toLowerCase() === departmentFilter.toLowerCase()

      // Price filter with operator
      let matchesPrice = true
      if (priceValue !== '') {
        const contractValue = parseFloat(contract.contract_value_usd)
        const filterValue = parseFloat(priceValue)
        switch (priceOperator) {
          case '>=':
            matchesPrice = contractValue >= filterValue
            break
          case '<=':
            matchesPrice = contractValue <= filterValue
            break
          case '>':
            matchesPrice = contractValue > filterValue
            break
          case '<':
            matchesPrice = contractValue < filterValue
            break
          case '=':
            matchesPrice = contractValue === filterValue
            break
          default:
            matchesPrice = true
        }
      }

      // Date range filters
      let matchesStartDate = true
      let matchesEndDate = true
      if (startDate) {
        const filterStart = new Date(startDate)
        const contractStart = new Date(contract.contract_start_date)
        matchesStartDate = contractStart >= filterStart
      }
      if (endDate) {
        const filterEnd = new Date(endDate)
        const contractEnd = new Date(contract.contract_end_date)
        matchesEndDate = contractEnd <= filterEnd
      }

      return matchesSearch && matchesStatus && matchesRisk && matchesDepartment && matchesPrice && matchesStartDate && matchesEndDate
    })
  }, [contracts, searchQuery, statusFilter, riskFilter, departmentFilter, priceOperator, priceValue, startDate, endDate])

  const getStatusBadgeVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success'
      case 'expired': return 'error'
      case 'pending renewal': return 'warning'
      case 'terminated': return 'error'
      default: return 'default'
    }
  }

  const getRiskBadgeVariant = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'success'
      case 'medium': return 'warning'
      case 'high': return 'error'
      default: return 'default'
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const uniqueDepartments = useMemo(() => {
    const depts = new Set(contracts.map(c => c.department).filter(Boolean))
    return Array.from(depts).sort()
  }, [contracts])

  const hasNoContracts = contracts.length === 0

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('All')
    setRiskFilter('All')
    setDepartmentFilter('All')
    setPriceOperator('>=')
    setPriceValue('')
    setStartDate('')
    setEndDate('')
  }

  const hasActiveFilters = searchQuery || statusFilter !== 'All' || riskFilter !== 'All' || 
    departmentFilter !== 'All' || priceValue || startDate || endDate

  return (
    <div className="flex flex-col h-full">
      {/* No Contracts Message */}
      {hasNoContracts ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-lyzr-light-2 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-lyzr-mid-4" />
            </div>
            <h3 className="font-playfair text-lg font-semibold text-lyzr-congo mb-2">
              No Contracts Available
            </h3>
            <p className="text-sm text-lyzr-mid-4">
              No contracts are currently available. Try adjusting your filters or search terms.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Main Filters */}
          <div className="px-4 py-3 border-b border-lyzr-cream">
            <div className="flex items-center gap-3 flex-wrap mb-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lyzr-mid-4" />
                <input
                  type="text"
                  placeholder="Search by vendor, ID, or category"
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
                  text-lyzr-congo focus:outline-none focus:border-lyzr-cream whitespace-nowrap"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Pending Renewal">Pending Renewal</option>
                <option value="Terminated">Terminated</option>
              </select>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-3 py-2 bg-lyzr-light-1 border border-transparent rounded-lg text-sm
                  text-lyzr-congo focus:outline-none focus:border-lyzr-cream whitespace-nowrap"
              >
                <option value="All">All Risk Levels</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="px-3 py-2 bg-lyzr-light-1 text-lyzr-congo rounded-lg text-sm font-medium
                  hover:bg-lyzr-cream transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                Advanced
                <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="px-3 py-2 bg-lyzr-light-1 text-lyzr-congo rounded-lg text-sm font-medium
                    hover:bg-lyzr-cream transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              )}
            </div>

            {/* Advanced Filters */}
            <AnimatePresence>
              {showAdvanced && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="pt-3 border-t border-lyzr-cream/50 mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
                >
                  {/* Department Filter */}
                  <div>
                    <label className="text-xs font-medium text-lyzr-mid-4 mb-1 block">Department</label>
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-lyzr-light-1 border border-transparent rounded-lg text-sm
                        text-lyzr-congo focus:outline-none focus:border-lyzr-cream"
                    >
                      <option value="All">All Departments</option>
                      {uniqueDepartments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Filter */}
                  <div>
                    <label className="text-xs font-medium text-lyzr-mid-4 mb-1 block">Contract Value</label>
                    <div className="flex gap-2">
                      <select
                        value={priceOperator}
                        onChange={(e) => setPriceOperator(e.target.value)}
                        className="px-2 py-2 bg-lyzr-light-1 border border-transparent rounded-lg text-sm
                          text-lyzr-congo focus:outline-none focus:border-lyzr-cream whitespace-nowrap"
                      >
                        <option value=">=">&gt;=</option>
                        <option value="<=">&lt;=</option>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value="=">=</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Enter amount"
                        value={priceValue}
                        onChange={(e) => setPriceValue(e.target.value)}
                        className="flex-1 px-3 py-2 bg-lyzr-light-1 border border-transparent rounded-lg text-sm
                          placeholder-lyzr-mid-4 focus:outline-none focus:border-lyzr-cream"
                      />
                    </div>
                  </div>

                  {/* Start Date Filter */}
                  <div>
                    <label className="text-xs font-medium text-lyzr-mid-4 mb-1 block">Start Date From</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-lyzr-light-1 border border-transparent rounded-lg text-sm
                        text-lyzr-congo focus:outline-none focus:border-lyzr-cream"
                    />
                  </div>

                  {/* End Date Filter */}
                  <div>
                    <label className="text-xs font-medium text-lyzr-mid-4 mb-1 block">End Date To</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-lyzr-light-1 border border-transparent rounded-lg text-sm
                        text-lyzr-congo focus:outline-none focus:border-lyzr-cream"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results Count */}
          <div className="px-4 py-2 bg-lyzr-light-1 text-sm text-lyzr-mid-4">
            Showing <strong>{filteredContracts.length}</strong> contract{filteredContracts.length !== 1 ? 's' : ''} of <strong>{contracts.length}</strong>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-lyzr-light-1 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-lyzr-mid-4">CONTRACT ID</th>
                  <th className="px-4 py-3 text-left font-medium text-lyzr-mid-4">VENDOR</th>
                  <th className="px-4 py-3 text-left font-medium text-lyzr-mid-4">CATEGORY</th>
                  <th className="px-4 py-3 text-left font-medium text-lyzr-mid-4">VALUE (USD)</th>
                  <th className="px-4 py-3 text-left font-medium text-lyzr-mid-4">STATUS</th>
                  <th className="px-4 py-3 text-left font-medium text-lyzr-mid-4">RISK</th>
                  <th className="px-4 py-3 text-left font-medium text-lyzr-mid-4">END DATE</th>
                  <th className="px-4 py-3 text-left font-medium text-lyzr-mid-4">DEPT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-lyzr-light-2">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonTableRow key={i} columns={8} />
                  ))
                ) : filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-lyzr-mid-4">
                      No contracts found
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract, index) => (
                    <motion.tr
                      key={contract.id || contract.contract_id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => onContractClick?.(contract)}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-lyzr-light-1 transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-lyzr-congo">{contract.contract_id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-lyzr-congo">{contract.vendor_name}</div>
                      </td>
                      <td className="px-4 py-3 text-lyzr-dark-2">
                        {contract.service_category || 'N/A'}
                      </td>
                      <td className="px-4 py-3 text-lyzr-dark-2 font-medium">
                        {formatCurrency(contract.contract_value_usd)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getStatusBadgeVariant(contract.contract_status)}>
                          {contract.contract_status || 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getRiskBadgeVariant(contract.risk_level)} size="sm">
                          {contract.risk_level || 'N/A'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-lyzr-dark-2 text-xs">
                        {formatDate(contract.contract_end_date)}
                      </td>
                      <td className="px-4 py-3 text-lyzr-dark-2 text-xs">
                        {contract.department || 'N/A'}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
