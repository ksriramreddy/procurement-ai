import { motion } from 'framer-motion'
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Shield,
  TrendingUp,
  Clock,
  Star,
  DollarSign,
  CheckCircle,
  ExternalLink
} from 'lucide-react'
import Badge from '../ui/Badge'
import Card, { CardTitle, CardContent } from '../ui/Card'
import Button from '../ui/Button'

export default function VendorDetails({ vendor }) {
  if (!vendor) {
    return (
      <div className="flex items-center justify-center h-full text-lyzr-mid-4">
        No vendor selected
      </div>
    )
  }

  const isExternal = vendor.source === 'external'

  return (
    <div className="p-4 space-y-4">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-lyzr-ferra to-lyzr-congo text-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-playfair text-xl font-semibold mb-1">{vendor.name}</h2>
            <p className="text-white/80 text-sm">{vendor.type}</p>
            {vendor.website && (
              <a
                href={vendor.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-white/90 hover:text-white mt-2"
              >
                <Globe className="w-4 h-4" />
                {vendor.website.replace(/^https?:\/\//, '')}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={vendor.status === 'Active' ? 'success' : 'default'}
              className="bg-white/20 text-white border-0"
            >
              {vendor.status || 'Available'}
            </Badge>
            {vendor.isPreferred && (
              <Badge className="bg-accent-warning/20 text-white border-0">
                <Star className="w-3 h-3 mr-1" /> Preferred
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      {!isExternal && (
        <div className="grid grid-cols-3 gap-3">
          <Card padding="sm" className="text-center">
            <div className="text-2xl font-semibold text-lyzr-ferra">
              {vendor.satisfactionScore || '-'}
            </div>
            <div className="text-xs text-lyzr-mid-4">Satisfaction</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-2xl font-semibold text-accent-success">
              {vendor.complianceScore || '-'}%
            </div>
            <div className="text-xs text-lyzr-mid-4">Compliance</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-2xl font-semibold text-accent-cool">
              {vendor.riskScore || '-'}
            </div>
            <div className="text-xs text-lyzr-mid-4">Risk Score</div>
          </Card>
        </div>
      )}

      {/* Contact Information */}
      <Card>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building2 className="w-4 h-4" />
          Contact Information
        </CardTitle>
        <CardContent className="mt-3 space-y-3">
          {vendor.contact?.name && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-lyzr-light-2 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-lyzr-ferra">
                  {vendor.contact.name.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-lyzr-congo">{vendor.contact.name}</p>
                <p className="text-xs text-lyzr-mid-4">Primary Contact</p>
              </div>
            </div>
          )}
          {vendor.contact?.email && (
            <div className="flex items-center gap-2 text-sm text-lyzr-dark-2">
              <Mail className="w-4 h-4 text-lyzr-mid-4" />
              <a href={`mailto:${vendor.contact.email}`} className="hover:text-accent-cool">
                {vendor.contact.email}
              </a>
            </div>
          )}
          {vendor.contact?.phone && (
            <div className="flex items-center gap-2 text-sm text-lyzr-dark-2">
              <Phone className="w-4 h-4 text-lyzr-mid-4" />
              {vendor.contact.phone}
            </div>
          )}
          {vendor.address && (
            <div className="flex items-center gap-2 text-sm text-lyzr-dark-2">
              <MapPin className="w-4 h-4 text-lyzr-mid-4" />
              {vendor.address}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Services */}
      <Card>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4" />
          Services Offered
        </CardTitle>
        <CardContent className="mt-3">
          <div className="flex flex-wrap gap-2">
            {(vendor.allServices || vendor.categories || []).map((service, i) => (
              <Badge key={i} variant="outline">{service}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      {vendor.certifications?.length > 0 && (
        <Card>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="w-4 h-4" />
            Certifications
          </CardTitle>
          <CardContent className="mt-3">
            <div className="flex flex-wrap gap-2">
              {vendor.certifications.map((cert, i) => (
                <Badge key={i} variant="success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {cert}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commercial Details */}
      {!isExternal && vendor.avgContractValue && (
        <Card>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="w-4 h-4" />
            Commercial Details
          </CardTitle>
          <CardContent className="mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-lyzr-mid-4">Avg Contract Value</span>
              <span className="font-medium text-lyzr-congo">
                ${vendor.avgContractValue?.toLocaleString()}
              </span>
            </div>
            {vendor.pricingModels?.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-lyzr-mid-4">Pricing Models</span>
                <span className="text-lyzr-dark-2">
                  {vendor.pricingModels.join(', ')}
                </span>
              </div>
            )}
            {vendor.currencies?.length > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-lyzr-mid-4">Currencies</span>
                <span className="text-lyzr-dark-2">
                  {vendor.currencies.join(', ')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {!isExternal && (vendor.slaUptime || vendor.responseTime) && (
        <Card>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4" />
            Performance
          </CardTitle>
          <CardContent className="mt-3 space-y-2">
            {vendor.slaUptime && (
              <div className="flex justify-between text-sm">
                <span className="text-lyzr-mid-4">SLA Uptime</span>
                <span className="font-medium text-accent-success">{vendor.slaUptime}%</span>
              </div>
            )}
            {vendor.responseTime && (
              <div className="flex justify-between text-sm">
                <span className="text-lyzr-mid-4">Avg Response Time</span>
                <span className="text-lyzr-dark-2">{vendor.responseTime} mins</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {vendor.notes && (
        <Card className="bg-lyzr-light-1 border-0">
          <p className="text-sm text-lyzr-dark-2 italic">{vendor.notes}</p>
        </Card>
      )}

      {/* Description for external vendors */}
      {isExternal && vendor.description && (
        <Card>
          <CardTitle className="text-base">About</CardTitle>
          <CardContent className="mt-3">
            <p className="text-sm text-lyzr-dark-2">{vendor.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="primary" className="flex-1">
          Create RFQ
        </Button>
        <Button variant="outline" className="flex-1">
          Contact Vendor
        </Button>
      </div>
    </div>
  )
}
