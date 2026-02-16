import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Lightbulb,
  ChevronDown,
  ExternalLink,
  Award,
  BarChart3,
  Leaf,
  Scale,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import Card, { CardTitle, CardContent } from '../ui/Card'
import Badge from '../ui/Badge'

// Animated score bar
const ScoreBar = ({ label, score, max = 100, color = 'bg-lyzr-ferra', delay = 0 }) => {
  const percentage = Math.min((score / max) * 100, 100)
  const getColor = () => {
    if (score <= 30) return 'bg-accent-success'
    if (score <= 60) return 'bg-accent-warning'
    return 'bg-accent-error'
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-lyzr-mid-4">{label}</span>
        <span className="text-xs font-semibold text-lyzr-congo">{score}</span>
      </div>
      <div className="h-1.5 bg-lyzr-light-2 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
          className={`h-full rounded-full ${color === 'risk' ? getColor() : color}`}
        />
      </div>
    </div>
  )
}

// Circular score indicator
const ScoreCircle = ({ score, label, size = 'md' }) => {
  const getScoreColor = () => {
    if (score >= 75) return 'text-accent-success'
    if (score >= 50) return 'text-accent-warning'
    return 'text-accent-error'
  }
  const getBgColor = () => {
    if (score >= 75) return 'bg-accent-success/10 border-accent-success/30'
    if (score >= 50) return 'bg-accent-warning/10 border-accent-warning/30'
    return 'bg-accent-error/10 border-accent-error/30'
  }
  const dim = size === 'lg' ? 'w-16 h-16' : 'w-12 h-12'
  const textSize = size === 'lg' ? 'text-xl' : 'text-base'

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className={`${dim} rounded-full ${getBgColor()} border-2 flex items-center justify-center`}
      >
        <span className={`${textSize} font-bold ${getScoreColor()}`}>{score}</span>
      </motion.div>
      {label && <span className="text-[10px] text-lyzr-mid-4 text-center leading-tight">{label}</span>}
    </div>
  )
}

const AnalysisSkeleton = () => {
  return (
    <div className="space-y-4">
      {/* Skeleton header */}
      <div className="flex items-center gap-3 p-4 bg-lyzr-light-1 rounded-xl">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-lyzr-light-2 via-lyzr-cream to-lyzr-light-2 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gradient-to-r from-lyzr-light-2 via-lyzr-cream to-lyzr-light-2 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-gradient-to-r from-lyzr-light-2 via-lyzr-cream to-lyzr-light-2 rounded animate-pulse w-1/2" />
        </div>
      </div>
      {/* Skeleton score cards */}
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 bg-gradient-to-r from-lyzr-light-2 via-lyzr-cream to-lyzr-light-2 rounded-xl animate-pulse" />
        ))}
      </div>
      {/* Skeleton sections */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-12 bg-gradient-to-r from-lyzr-light-2 via-lyzr-cream to-lyzr-light-2 rounded-xl animate-pulse" />
      ))}
    </div>
  )
}

export default function VendorAnalysisCard({ analysis, isLoading = false }) {
  const [expandedSections, setExpandedSections] = useState({
    scoring: true,
    risks: false,
    strengths: false,
    considerations: false,
    positioning: false,
    usecases: false,
    sources: false
  })

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (isLoading) return <AnalysisSkeleton />
  if (!analysis) return null

  let data = analysis
  if (typeof analysis === 'string') {
    try { data = JSON.parse(analysis) } catch { return null }
  }

  const {
    vendor_overview = {},
    market_positioning = {},
    advantages = [],
    disadvantages = [],
    risk_score_breakdown = {},
    risk_indicators = {},
    compliance_maturity = '',
    esg_assessment = '',
    financial_stability_indicator = '',
    vendor_scoring = {},
    use_case_fit = {},
    decision_recommendation = '',
    confidence_note = '',
    sources = []
  } = data

  const overallScore = vendor_scoring.overall_vendor_score || 0
  const weightedRisk = risk_score_breakdown.weighted_risk_score ?? risk_score_breakdown.weighted_risk ?? null

  const getRecommendationStyle = () => {
    const rec = decision_recommendation?.toLowerCase() || ''
    if (rec.includes('recommend') && !rec.includes('not')) return { variant: 'success', icon: ThumbsUp }
    if (rec.includes('not') || rec.includes('avoid')) return { variant: 'error', icon: ThumbsDown }
    return { variant: 'warning', icon: Scale }
  }
  const recStyle = getRecommendationStyle()

  const Section = ({ title, icon: Icon, sectionKey, variant = 'default', count, children }) => {
    const isExpanded = expandedSections[sectionKey]
    const colors = {
      success: { border: 'border-accent-success/20', text: 'text-accent-success', bg: 'hover:bg-accent-success/5' },
      warning: { border: 'border-accent-warning/20', text: 'text-accent-warning', bg: 'hover:bg-accent-warning/5' },
      error: { border: 'border-accent-error/20', text: 'text-accent-error', bg: 'hover:bg-accent-error/5' },
      info: { border: 'border-accent-cool/20', text: 'text-accent-cool', bg: 'hover:bg-accent-cool/5' },
      default: { border: 'border-lyzr-cream', text: 'text-lyzr-ferra', bg: 'hover:bg-lyzr-light-1' }
    }
    const c = colors[variant] || colors.default

    return (
      <div className={`border ${c.border} rounded-xl overflow-hidden bg-white`}>
        <button
          onClick={() => toggleSection(sectionKey)}
          className={`w-full flex items-center justify-between px-4 py-3 ${c.bg} transition-colors text-left`}
        >
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${c.text}`} />
            <span className="text-sm font-medium text-lyzr-congo">{title}</span>
            {count != null && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.text} bg-current/10`}>{count}</span>
            )}
          </div>
          <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4 text-lyzr-mid-4" />
          </motion.div>
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 pt-1">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Decision Recommendation Banner */}
      {decision_recommendation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
            recStyle.variant === 'success' ? 'bg-accent-success/10 border-accent-success/30' :
            recStyle.variant === 'error' ? 'bg-accent-error/10 border-accent-error/30' :
            'bg-accent-warning/10 border-accent-warning/30'
          }`}
        >
          <recStyle.icon className={`w-5 h-5 flex-shrink-0 ${
            recStyle.variant === 'success' ? 'text-accent-success' :
            recStyle.variant === 'error' ? 'text-accent-error' :
            'text-accent-warning'
          }`} />
          <div>
            <p className="text-xs text-lyzr-mid-4">AI Recommendation</p>
            <p className={`text-sm font-semibold ${
              recStyle.variant === 'success' ? 'text-accent-success' :
              recStyle.variant === 'error' ? 'text-accent-error' :
              'text-accent-warning'
            }`}>{decision_recommendation}</p>
          </div>
        </motion.div>
      )}

      {/* Overall Score + Key Metrics */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-lyzr-light-1 to-white rounded-xl border border-lyzr-cream">
        {overallScore > 0 && (
          <ScoreCircle score={Math.round(overallScore)} label="Overall Score" size="lg" />
        )}
        <div className="flex-1 grid grid-cols-2 gap-2">
          {vendor_overview.brand_presence_score != null && (
            <div className="text-center p-2 rounded-lg bg-white border border-lyzr-cream">
              <p className="text-lg font-bold text-lyzr-ferra">{vendor_overview.brand_presence_score}</p>
              <p className="text-[10px] text-lyzr-mid-4">Brand Presence</p>
            </div>
          )}
          {weightedRisk != null && (
            <div className="text-center p-2 rounded-lg bg-white border border-lyzr-cream">
              <p className={`text-lg font-bold ${weightedRisk <= 30 ? 'text-accent-success' : weightedRisk <= 60 ? 'text-accent-warning' : 'text-accent-error'}`}>
                {weightedRisk}
              </p>
              <p className="text-[10px] text-lyzr-mid-4">Risk Score</p>
            </div>
          )}
          {vendor_scoring.compliance_certifications_score != null && (
            <div className="text-center p-2 rounded-lg bg-white border border-lyzr-cream">
              <p className="text-lg font-bold text-accent-success">{vendor_scoring.compliance_certifications_score}</p>
              <p className="text-[10px] text-lyzr-mid-4">Compliance</p>
            </div>
          )}
          {vendor_scoring.past_performance_score != null && (
            <div className="text-center p-2 rounded-lg bg-white border border-lyzr-cream">
              <p className="text-lg font-bold text-accent-cool">{vendor_scoring.past_performance_score}</p>
              <p className="text-[10px] text-lyzr-mid-4">Performance</p>
            </div>
          )}
        </div>
      </div>

      {/* AI Overview Quick Info */}
      <div className="flex flex-wrap gap-2">
        {vendor_overview.market_status && (
          <Badge variant="info" size="sm">{vendor_overview.market_status}</Badge>
        )}
        {vendor_overview.parent_company && (
          <Badge variant="outline" size="sm">Parent: {vendor_overview.parent_company}</Badge>
        )}
        {vendor_overview.headquarters && (
          <Badge variant="outline" size="sm">{vendor_overview.headquarters}</Badge>
        )}
      </div>

      {/* Credibility */}
      {vendor_overview.credibility_assessment && (
        <div className="p-3 rounded-lg bg-accent-success/5 border border-accent-success/20">
          <p className="text-xs text-accent-success font-medium flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {vendor_overview.credibility_assessment}
          </p>
        </div>
      )}

      {/* Vendor Scoring Breakdown */}
      {Object.keys(vendor_scoring).length > 1 && (
        <Section title="Vendor Scoring" icon={BarChart3} sectionKey="scoring" variant="default">
          <div className="space-y-2.5">
            {vendor_scoring.existing_vendor_same_scope != null && (
              <ScoreBar label="Same Scope Fit" score={vendor_scoring.existing_vendor_same_scope} color="bg-lyzr-ferra" delay={0} />
            )}
            {vendor_scoring.existing_vendor_different_scope != null && (
              <ScoreBar label="Different Scope Fit" score={vendor_scoring.existing_vendor_different_scope} color="bg-lyzr-ferra" delay={0.05} />
            )}
            {vendor_scoring.risk_score_weighted != null && (
              <ScoreBar label="Risk (inverted)" score={vendor_scoring.risk_score_weighted} color="bg-accent-cool" delay={0.1} />
            )}
            {vendor_scoring.compliance_certifications_score != null && (
              <ScoreBar label="Compliance & Certs" score={vendor_scoring.compliance_certifications_score} color="bg-accent-success" delay={0.15} />
            )}
            {vendor_scoring.esg_score != null && (
              <ScoreBar label="ESG" score={vendor_scoring.esg_score} color="bg-green-500" delay={0.2} />
            )}
            {vendor_scoring.historical_pricing_score != null && (
              <ScoreBar label="Historical Pricing" score={vendor_scoring.historical_pricing_score} color="bg-accent-warm" delay={0.25} />
            )}
            {vendor_scoring.quoted_price_score != null && (
              <ScoreBar label="Quoted Price" score={vendor_scoring.quoted_price_score} color="bg-accent-warm" delay={0.3} />
            )}
            {vendor_scoring.past_performance_score != null && (
              <ScoreBar label="Past Performance" score={vendor_scoring.past_performance_score} color="bg-accent-cool" delay={0.35} />
            )}
            {vendor_scoring.delivery_reliability_score != null && (
              <ScoreBar label="Delivery Reliability" score={vendor_scoring.delivery_reliability_score} color="bg-accent-cool" delay={0.4} />
            )}
          </div>
        </Section>
      )}

      {/* Risk Score Breakdown */}
      {Object.keys(risk_score_breakdown).length > 0 && (
        <Section title="Risk Breakdown" icon={Shield} sectionKey="risks" variant="error">
          <div className="space-y-2.5">
            {risk_score_breakdown.financial_risk_score != null && (
              <ScoreBar label="Financial Risk" score={risk_score_breakdown.financial_risk_score} color="risk" delay={0} />
            )}
            {risk_score_breakdown.cyber_risk_score != null && (
              <ScoreBar label="Cyber Risk" score={risk_score_breakdown.cyber_risk_score} color="risk" delay={0.05} />
            )}
            {risk_score_breakdown.geopolitical_risk_score != null && (
              <ScoreBar label="Geopolitical Risk" score={risk_score_breakdown.geopolitical_risk_score} color="risk" delay={0.1} />
            )}
            {risk_score_breakdown.legal_regulatory_risk_score != null && (
              <ScoreBar label="Legal/Regulatory Risk" score={risk_score_breakdown.legal_regulatory_risk_score} color="risk" delay={0.15} />
            )}
            {risk_score_breakdown.operational_risk_score != null && (
              <ScoreBar label="Operational Risk" score={risk_score_breakdown.operational_risk_score} color="risk" delay={0.2} />
            )}
          </div>
          {/* Old risk_indicators fallback */}
          {risk_indicators?.operational_risk && (
            <div className="mt-3 p-2.5 rounded-lg bg-accent-error/5 border border-accent-error/10">
              <p className="text-xs text-lyzr-dark-2">{risk_indicators.operational_risk}</p>
            </div>
          )}
        </Section>
      )}

      {/* Strengths */}
      {advantages?.length > 0 && (
        <Section title="Strengths" icon={CheckCircle} sectionKey="strengths" variant="success" count={advantages.length}>
          <div className="space-y-1.5">
            {advantages.map((adv, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex gap-2 p-2 rounded-lg bg-accent-success/5"
              >
                <CheckCircle className="w-3.5 h-3.5 text-accent-success flex-shrink-0 mt-0.5" />
                <span className="text-xs text-lyzr-dark-2">{adv}</span>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Considerations */}
      {disadvantages?.length > 0 && (
        <Section title="Considerations" icon={AlertTriangle} sectionKey="considerations" variant="warning" count={disadvantages.length}>
          <div className="space-y-1.5">
            {disadvantages.map((dis, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex gap-2 p-2 rounded-lg bg-accent-warning/5"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-accent-warning flex-shrink-0 mt-0.5" />
                <span className="text-xs text-lyzr-dark-2">{dis}</span>
              </motion.div>
            ))}
          </div>
        </Section>
      )}

      {/* Market Positioning */}
      {market_positioning.category && (
        <Section title="Market Positioning" icon={Globe} sectionKey="positioning" variant="info">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-lyzr-mid-4 mb-1">Category</p>
              <p className="text-xs text-lyzr-dark-2">{market_positioning.category}</p>
            </div>
            {market_positioning.target_customers && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-lyzr-mid-4 mb-1">Target Customers</p>
                <p className="text-xs text-lyzr-dark-2">{market_positioning.target_customers}</p>
              </div>
            )}
            {market_positioning.typical_deal_size && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-lyzr-mid-4 mb-1">Typical Deal Size</p>
                <p className="text-xs text-lyzr-dark-2">{market_positioning.typical_deal_size}</p>
              </div>
            )}
            {market_positioning.geographic_focus?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-lyzr-mid-4 mb-1.5">Geographic Focus</p>
                <div className="flex flex-wrap gap-1.5">
                  {market_positioning.geographic_focus.map((region, i) => (
                    <Badge key={i} variant="outline" size="sm">{region}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Assessment Indicators */}
      {(compliance_maturity || esg_assessment || financial_stability_indicator) && (
        <div className="space-y-2">
          {compliance_maturity && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-accent-success/5 border border-accent-success/10">
              <Award className="w-4 h-4 text-accent-success flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-accent-success font-semibold mb-0.5">Compliance Maturity</p>
                <p className="text-xs text-lyzr-dark-2">{compliance_maturity}</p>
              </div>
            </div>
          )}
          {esg_assessment && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-green-50 border border-green-200/50">
              <Leaf className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-green-600 font-semibold mb-0.5">ESG Assessment</p>
                <p className="text-xs text-lyzr-dark-2">{esg_assessment}</p>
              </div>
            </div>
          )}
          {financial_stability_indicator && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-accent-cool/5 border border-accent-cool/10">
              <TrendingUp className="w-4 h-4 text-accent-cool flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase tracking-wider text-accent-cool font-semibold mb-0.5">Financial Stability</p>
                <p className="text-xs text-lyzr-dark-2">{financial_stability_indicator}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Use Case Fit */}
      {(use_case_fit.best_suited_for?.length > 0 || use_case_fit.not_ideal_for?.length > 0) && (
        <Section title="Use Case Fit" icon={Target} sectionKey="usecases" variant="info">
          <div className="space-y-3">
            {use_case_fit.best_suited_for?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-accent-success font-semibold mb-1.5">Best Suited For</p>
                <div className="space-y-1">
                  {use_case_fit.best_suited_for.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Lightbulb className="w-3 h-3 text-accent-success flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-lyzr-dark-2">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {use_case_fit.not_ideal_for?.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-accent-error font-semibold mb-1.5">Not Ideal For</p>
                <div className="space-y-1">
                  {use_case_fit.not_ideal_for.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <XCircle className="w-3 h-3 text-accent-error flex-shrink-0 mt-0.5" />
                      <span className="text-xs text-lyzr-dark-2">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Sources */}
      {sources?.length > 0 && (
        <Section title="Sources" icon={ExternalLink} sectionKey="sources" variant="default">
          <div className="space-y-2">
            {sources.map((src, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-lyzr-light-1">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-lyzr-congo truncate">{src.source_name}</p>
                  <p className="text-[10px] text-lyzr-mid-4">{src.source_type}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge size="sm" variant={src.confidence_level === 'High' ? 'success' : 'outline'}>
                    {src.confidence_level}
                  </Badge>
                  {src.reference_link && (
                    <a href={src.reference_link} target="_blank" rel="noopener noreferrer"
                      className="text-accent-cool hover:text-accent-cool/80">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Confidence Note */}
      {confidence_note && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-lyzr-light-1 border border-lyzr-cream">
          <Brain className="w-3.5 h-3.5 text-lyzr-mid-4 flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-lyzr-mid-4 italic leading-relaxed">{confidence_note}</p>
        </div>
      )}
    </motion.div>
  )
}
