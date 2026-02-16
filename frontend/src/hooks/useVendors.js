import { useState, useCallback } from 'react'
import { queryVendors, getAllVendors, getVendorById, transformVendorForDisplay } from '../services/mongodb'

/**
 * Hook for vendor data management
 */
export function useVendors() {
  const [vendors, setVendors] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Search vendors
  const searchVendors = useCallback(async ({ vendorNames = [], categories = [] }) => {
    setIsLoading(true)
    setError(null)

    try {
      const results = await queryVendors({ vendorNames, categories })
      const transformed = results.map(transformVendorForDisplay)
      setVendors(transformed)
      return transformed
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get all vendors
  const fetchAllVendors = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const results = await getAllVendors()
      const transformed = results.map(transformVendorForDisplay)
      setVendors(transformed)
      return transformed
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get vendor by ID
  const fetchVendorById = useCallback(async (vendorId) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getVendorById(vendorId)
      return result ? transformVendorForDisplay(result) : null
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    vendors,
    isLoading,
    error,
    searchVendors,
    fetchAllVendors,
    fetchVendorById
  }
}

export default useVendors
