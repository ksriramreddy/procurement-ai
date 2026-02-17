import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import ContractTable from './ContractTable'
import VendorDetailPage from './VendorDetailPage'
import backendApi from '../../services/backendApi'

export default function ContractsPortal() {
  const [contracts, setContracts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedVendorId, setSelectedVendorId] = useState(null)

  useEffect(() => {
    fetchContracts()
  }, [])

  const fetchContracts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await backendApi.get('/api/contracts')
      setContracts(response.data || [])
    } catch (err) {
      console.error('Failed to fetch contracts:', err)
      setError(err.message || 'Failed to fetch contracts')
      setContracts([])
    } finally {
      setIsLoading(false)
    }
  }

  // If a vendor is selected, show the vendor detail page
  if (selectedVendorId) {
    return (
      <VendorDetailPage
        vendorId={selectedVendorId}
        onBack={() => setSelectedVendorId(null)}
      />
    )
  }

  // Otherwise show the contracts list
  return (
    <div className="flex flex-col h-full bg-lyzr-white-amber">
      {/* Header */}
      <div className="px-6 py-4 border-b border-lyzr-cream bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-playfair text-2xl font-semibold text-lyzr-congo">Contracts</h1>
            <p className="text-sm text-lyzr-mid-4 mt-1">
              Manage and view all active contracts
            </p>
          </div>
          <button
            onClick={fetchContracts}
            disabled={isLoading}
            className="px-4 py-2 bg-lyzr-ferra text-white rounded-lg hover:bg-lyzr-congo 
              disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">{error}</p>
            <button
              onClick={fetchContracts}
              className="text-sm text-red-700 hover:text-red-800 underline mt-1"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Contracts Table */}
      <div className="flex-1 overflow-auto">
        <ContractTable
          contracts={contracts}
          isLoading={isLoading}
          onContractClick={(contract) => setSelectedVendorId(contract.vendor_id)}
        />
      </div>
    </div>
  )
}
