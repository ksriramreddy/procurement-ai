import { motion } from 'framer-motion'
import Badge from '../ui/Badge'

export default function QuickViewTable({ data }) {
  const getStatusVariant = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'success'
      case 'expiring': return 'warning'
      case 'expired': return 'error'
      case 'draft': return 'default'
      default: return 'default'
    }
  }

  const isExpiringSoon = (expiry) => {
    if (expiry === '-') return false
    const expiryDate = new Date(expiry)
    const today = new Date()
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-lyzr-light-1">
          <tr>
            <th className="px-5 py-3 text-left font-medium text-lyzr-mid-4 uppercase text-xs tracking-wider">
              Contract ID
            </th>
            <th className="px-5 py-3 text-left font-medium text-lyzr-mid-4 uppercase text-xs tracking-wider">
              Vendor
            </th>
            <th className="px-5 py-3 text-left font-medium text-lyzr-mid-4 uppercase text-xs tracking-wider">
              Type
            </th>
            <th className="px-5 py-3 text-left font-medium text-lyzr-mid-4 uppercase text-xs tracking-wider">
              Value
            </th>
            <th className="px-5 py-3 text-left font-medium text-lyzr-mid-4 uppercase text-xs tracking-wider">
              Status
            </th>
            <th className="px-5 py-3 text-left font-medium text-lyzr-mid-4 uppercase text-xs tracking-wider">
              Expiry
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-lyzr-light-2">
          {data.map((row, index) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="hover:bg-lyzr-light-1 cursor-pointer transition-colors"
            >
              <td className="px-5 py-4">
                <span className="font-mono text-lyzr-congo font-medium">{row.id}</span>
              </td>
              <td className="px-5 py-4">
                <span className="text-lyzr-congo">{row.vendor}</span>
              </td>
              <td className="px-5 py-4">
                <span className="text-lyzr-dark-2">{row.type}</span>
              </td>
              <td className="px-5 py-4">
                <span className="font-medium text-lyzr-congo">{row.value}</span>
              </td>
              <td className="px-5 py-4">
                <Badge variant={getStatusVariant(row.status)}>
                  {row.status}
                </Badge>
              </td>
              <td className="px-5 py-4">
                <span className={`${
                  isExpiringSoon(row.expiry) ? 'text-accent-warning font-medium' : 'text-lyzr-dark-2'
                }`}>
                  {row.expiry}
                </span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>

      {/* View All Link */}
      <div className="px-5 py-3 border-t border-lyzr-light-2 text-center">
        <button className="text-sm text-accent-cool hover:underline font-medium">
          View All Contracts
        </button>
      </div>
    </div>
  )
}
