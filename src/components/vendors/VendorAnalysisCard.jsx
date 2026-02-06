import { motion } from 'framer-motion'
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Target,
  Shield,
  Zap,
  Brain,
  Globe,
  Users,
  Lightbulb
} from 'lucide-react'
import Card, { CardTitle, CardContent } from '../ui/Card'
import Badge from '../ui/Badge'

const AnalysisSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Skeleton Overview */}
      <Card className="overflow-hidden">
        <div className="h-6 bg-gradient-to-r from-lyzr-light-2 via-lyzr-cream to-lyzr-light-2 rounded animate-pulse mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gradient-to-r from-lyzr-light-2 via-lyzr-cream to-lyzr-light-2 rounded animate-pulse"></div>
          <div className="h-4 bg-gradient-to-r from-lyzr-light-2 via-lyzr-cream to-lyzr-light-2 rounded animate-pulse w-5/6"></div>
        </div>
      </Card>

      {/* Skeleton Grid */}
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="h-5 bg-gradient-to-r from-lyzr-light-2 via-lyzr-cream to-lyzr-light-2 rounded animate-pulse mb-3"></div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, j) => (
              <div
                key={j}
                className="h-4 bg-gradient-to-r from-lyzr-light-2 via-lyzr-cream to-lyzr-light-2 rounded animate-pulse"
              ></div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  )
}

export default function VendorAnalysisCard({ analysis, isLoading = false }) {
  if (isLoading) {
    return <AnalysisSkeleton />
  }

  if (!analysis) {
    return null
  }

  // Parse the analysis if it's a string
  let parsedAnalysis = analysis
  if (typeof analysis === 'string') {
    try {
      parsedAnalysis = JSON.parse(analysis)
    } catch {
      return null
    }
  }

  const {
    vendor_overview = {},
    market_positioning = {},
    advantages = [],
    disadvantages = [],
    risk_indicators = {},
    use_case_fit = {},
    confidence_note = ''
  } = parsedAnalysis

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Vendor Overview */}
      <Card className="border-2 border-accent-success/20 bg-gradient-to-br from-accent-success/5 to-transparent">
        <CardTitle className="flex items-center gap-2 text-base text-accent-success">
          <Brain className="w-4 h-4" />
          AI Analysis
        </CardTitle>
        <CardContent className="mt-3 space-y-2">
          {vendor_overview.market_status && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-lyzr-mid-4">Market Status</span>
              <Badge variant="info">{vendor_overview.market_status}</Badge>
            </div>
          )}
          {vendor_overview.parent_company && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-lyzr-mid-4">Parent Company</span>
              <span className="text-sm font-medium text-lyzr-congo">{vendor_overview.parent_company}</span>
            </div>
          )}
          {vendor_overview.credibility_assessment && (
            <div className="mt-3 p-3 bg-accent-success/10 rounded-lg border border-accent-success/20">
              <p className="text-sm text-accent-success font-medium">✓ {vendor_overview.credibility_assessment}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Positioning */}
      {market_positioning.category && (
        <Card className="border-l-4 border-accent-cool">
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="w-4 h-4 text-accent-cool" />
            Market Positioning
          </CardTitle>
          <CardContent className="mt-3 space-y-3">
            {market_positioning.category && (
              <div>
                <p className="text-xs text-lyzr-mid-4 mb-1">Category</p>
                <p className="text-sm text-lyzr-dark-2">{market_positioning.category}</p>
              </div>
            )}
            {market_positioning.target_customers && (
              <div>
                <p className="text-xs text-lyzr-mid-4 mb-1">Target Customers</p>
                <p className="text-sm text-lyzr-dark-2">{market_positioning.target_customers}</p>
              </div>
            )}
            {market_positioning.typical_deal_size && (
              <div>
                <p className="text-xs text-lyzr-mid-4 mb-1">Typical Deal Size</p>
                <p className="text-sm text-lyzr-dark-2">{market_positioning.typical_deal_size}</p>
              </div>
            )}
            {market_positioning.geographic_focus?.length > 0 && (
              <div>
                <p className="text-xs text-lyzr-mid-4 mb-1">Geographic Focus</p>
                <div className="flex flex-wrap gap-2">
                  {market_positioning.geographic_focus.map((region, i) => (
                    <Badge key={i} variant="outline" size="sm">{region}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Advantages */}
      {advantages?.length > 0 && (
        <Card className="border-2 border-accent-success/30 bg-gradient-to-br from-accent-success/5 to-transparent">
          <CardTitle className="flex items-center gap-2 text-base text-accent-success">
            <CheckCircle className="w-4 h-4" />
            Strengths ({advantages.length})
          </CardTitle>
          <CardContent className="mt-3 space-y-2">
            {advantages.map((advantage, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 p-2 rounded-lg bg-accent-success/5"
              >
                <CheckCircle className="w-4 h-4 text-accent-success flex-shrink-0 mt-0.5" />
                <span className="text-sm text-lyzr-dark-2">{advantage}</span>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Disadvantages */}
      {disadvantages?.length > 0 && (
        <Card className="border-2 border-accent-warning/30 bg-gradient-to-br from-accent-warning/5 to-transparent">
          <CardTitle className="flex items-center gap-2 text-base text-accent-warning">
            <AlertTriangle className="w-4 h-4" />
            Considerations ({disadvantages.length})
          </CardTitle>
          <CardContent className="mt-3 space-y-2">
            {disadvantages.map((disadvantage, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 p-2 rounded-lg bg-accent-warning/5"
              >
                <AlertTriangle className="w-4 h-4 text-accent-warning flex-shrink-0 mt-0.5" />
                <span className="text-sm text-lyzr-dark-2">{disadvantage}</span>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Risk Indicators */}
      {Object.keys(risk_indicators).length > 0 && (
        <Card className="border-l-4 border-accent-error/50">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-accent-error/70" />
            Risk Assessment
          </CardTitle>
          <CardContent className="mt-3 space-y-3">
            {risk_indicators.operational_risk && (
              <div className="p-3 rounded-lg bg-accent-error/5 border border-accent-error/20">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-accent-error" />
                  <span className="text-xs font-semibold text-accent-error">Operational Risk</span>
                </div>
                <p className="text-sm text-lyzr-dark-2">{risk_indicators.operational_risk}</p>
              </div>
            )}
            {risk_indicators.scalability_risk && (
              <div className="p-3 rounded-lg bg-accent-warning/5 border border-accent-warning/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-accent-warning" />
                  <span className="text-xs font-semibold text-accent-warning">Scalability Risk</span>
                </div>
                <p className="text-sm text-lyzr-dark-2">{risk_indicators.scalability_risk}</p>
              </div>
            )}
            {risk_indicators.vendor_lock_in_risk && (
              <div className="p-3 rounded-lg bg-accent-cool/5 border border-accent-cool/20">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-accent-cool" />
                  <span className="text-xs font-semibold text-accent-cool">Vendor Lock-in Risk</span>
                </div>
                <p className="text-sm text-lyzr-dark-2">{risk_indicators.vendor_lock_in_risk}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Use Case Fit */}
      {use_case_fit.best_suited_for?.length > 0 && (
        <Card className="border-l-4 border-accent-cool">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-4 h-4 text-accent-cool" />
            Best Use Cases
          </CardTitle>
          <CardContent className="mt-3 space-y-2">
            {use_case_fit.best_suited_for.map((useCase, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 p-2 rounded-lg bg-accent-cool/5"
              >
                <Lightbulb className="w-4 h-4 text-accent-cool flex-shrink-0 mt-0.5" />
                <span className="text-sm text-lyzr-dark-2">{useCase}</span>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Confidence Note */}
      {confidence_note && (
        <div className="p-3 rounded-lg bg-lyzr-light-1 border border-lyzr-cream text-xs text-lyzr-mid-4 italic">
          📊 {confidence_note}
        </div>
      )}
    </motion.div>
  )
}
