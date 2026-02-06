import { motion } from 'framer-motion'
import { Building2, MapPin, Star, ChevronRight } from 'lucide-react'
import Badge from '../ui/Badge'
import Card from '../ui/Card'

export default function VendorCard({ vendor, onClick }) {
  const getRiskBadgeVariant = (riskLevel) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low': return 'success'
      case 'medium': return 'warning'
      case 'high': return 'error'
      default: return 'default'
    }
  }

  return (
    <Card hover onClick={onClick} className="group">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 bg-lyzr-cream rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-lyzr-ferra" />
          </div>

          {/* Info */}
          <div>
            <h3 className="font-medium text-lyzr-congo group-hover:text-lyzr-ferra transition-colors">
              {vendor.name}
            </h3>
            <p className="text-xs text-lyzr-mid-4 mt-0.5">{vendor.type}</p>

            {/* Location */}
            {vendor.headquarters && (
              <div className="flex items-center gap-1 text-xs text-lyzr-mid-4 mt-2">
                <MapPin className="w-3 h-3" />
                {vendor.headquarters}
              </div>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-lyzr-mid-3 group-hover:text-lyzr-ferra
          group-hover:translate-x-1 transition-all" />
      </div>

      {/* Bottom Row */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-lyzr-light-2">
        {/* Risk Score */}
        {vendor.riskScore != null ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-lyzr-mid-4">Risk Score:</span>
            <span className="font-medium text-lyzr-congo">{vendor.riskScore}</span>
            <Badge variant={getRiskBadgeVariant(vendor.riskLevel)} size="sm">
              {vendor.riskLevel}
            </Badge>
          </div>
        ) : (
          <div />
        )}

        {/* Preferred Badge */}
        {vendor.isPreferred && (
          <Badge variant="warning" size="sm">
            <Star className="w-3 h-3 mr-1" />
            Preferred
          </Badge>
        )}
      </div>
    </Card>
  )
}
