import { motion } from 'framer-motion'
import { BarChart3, PieChart as PieChartIcon, TrendingUp, FileText } from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Area, AreaChart
} from 'recharts'
import { renderLinkedText } from '../../utils/renderLinkedText'

const COLORS = [
  '#4A2F2D', '#71514F', '#E3D0C2', '#8B6F6D', '#C4A69C',
  '#6B8E8D', '#A3C4BC', '#D4A574', '#9B7E6B', '#B8A090',
  '#7C9A92', '#D9BFA9', '#5E4B4A', '#A08478', '#C7B6AA',
  '#8CA3A0', '#E8D5C4', '#6E5856', '#B39488', '#D1C4BA',
  '#94B3AD'
]

const formatValue = (value) => {
  if (typeof value !== 'number') return value
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  if (value % 1 !== 0) return `${value.toFixed(1)}%`
  return value.toLocaleString()
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-lyzr-cream text-xs">
      {label && <p className="font-medium text-lyzr-congo mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.fill }} className="font-medium">
          {entry.name}: {formatValue(entry.value)}
        </p>
      ))}
    </div>
  )
}

export default function ChartCard({ chartData, onVendorClick }) {
  console.log('[ChartCard] 🎨 ChartCard render - chartData present:', !!chartData)

  if (!chartData) {
    console.error('[ChartCard] ❌ chartData is null/undefined')
    return null
  }

  const { chart_type, title, labels, data } = chartData
  console.log('[ChartCard] ✅ Chart props extracted:')
  console.log('[ChartCard]   - chart_type:', chart_type)
  console.log('[ChartCard]   - title:', title)
  console.log('[ChartCard]   - labels type:', typeof labels, Array.isArray(labels) ? `(${labels.length} items)` : '')
  console.log('[ChartCard]   - data type:', typeof data)
  
  // For text type, log the actual data to verify HTML tags are present
  if (chart_type === 'text' && typeof data === 'string') {
    console.log('[ChartCard] 📄 TEXT CHART RENDER')
    console.log('[ChartCard] Text data length:', data.length)
    console.log('[ChartCard] Text data preview:', data.substring(0, 300))
    console.log('[ChartCard] Contains HTML tags:', data.includes('<a href'))
  }

  const iconMap = {
    pie: PieChartIcon,
    bar: BarChart3,
    line: TrendingUp,
    text: FileText
  }
  const Icon = iconMap[chart_type] || FileText

  // Text output
  if (chart_type === 'text') {
    // Split text into sections: intro paragraph, numbered items, and summary/footer
    const lines = (typeof data === 'string' ? data : '').split('\n').filter(l => l.trim())
    const numberedItems = []
    const introLines = []
    const summaryLines = []
    let pastItems = false

    for (const line of lines) {
      const trimmed = line.trim()
      // Match numbered items: "1)", "1.", "1 -", etc.
      if (/^\d+[\).\-]/.test(trimmed)) {
        numberedItems.push(trimmed.replace(/^\d+[\).\-]\s*/, ''))
        pastItems = true
      } else if (!pastItems && numberedItems.length === 0) {
        introLines.push(trimmed)
      } else {
        pastItems = true
        summaryLines.push(trimmed)
      }
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full mt-3 rounded-xl border border-lyzr-cream bg-white overflow-hidden shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-lyzr-cream/60 bg-gradient-to-r from-lyzr-congo/5 to-lyzr-ferra/5">
          <div className="w-8 h-8 rounded-lg bg-lyzr-congo/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-lyzr-congo" />
          </div>
          <h4 className="font-semibold text-sm text-lyzr-congo">{title}</h4>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Intro paragraph */}
          {introLines.length > 0 && (
            <p className="text-sm text-lyzr-mid-4 leading-relaxed">
              {renderLinkedText(introLines.join(' '), onVendorClick)}
            </p>
          )}

          {/* Numbered items as styled cards */}
          {numberedItems.length > 0 && (
            <div className="space-y-2">
              {numberedItems.map((item, i) => {
                // Parse "VendorName — Service: X — Budget: Y" pattern
                const parts = item.split(/\s*—\s*|\s*\|\s*/)
                return (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-lyzr-light-1 to-white border border-lyzr-cream/50"
                  >
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-lyzr-ferra/10 text-lyzr-ferra text-xs font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      {parts.length > 1 ? (
                        <>
                          <p className="text-sm font-medium text-lyzr-congo">
                            {renderLinkedText(parts[0], onVendorClick)}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            {parts.slice(1).map((part, j) => {
                              const [label, ...vals] = part.split(':')
                              const value = vals.join(':').trim()
                              return value ? (
                                <span key={j} className="text-xs text-lyzr-mid-4">
                                  <span className="font-medium text-lyzr-congo/70">{label.trim()}:</span>{' '}
                                  {renderLinkedText(value, onVendorClick)}
                                </span>
                              ) : (
                                <span key={j} className="text-xs text-lyzr-mid-4">
                                  {renderLinkedText(part.trim(), onVendorClick)}
                                </span>
                              )
                            })}
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-lyzr-congo">
                          {renderLinkedText(item, onVendorClick)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Summary / footer text */}
          {summaryLines.length > 0 && (
            <div className="pt-2 border-t border-lyzr-cream/40">
              <p className="text-sm text-lyzr-mid-4 leading-relaxed">
                {renderLinkedText(summaryLines.join(' '), onVendorClick)}
              </p>
            </div>
          )}

          {/* Fallback: if no structure detected, render everything as-is */}
          {numberedItems.length === 0 && introLines.length === 0 && summaryLines.length === 0 && (
            <p className="text-sm text-lyzr-congo leading-relaxed whitespace-pre-wrap">
              {renderLinkedText(data, onVendorClick)}
            </p>
          )}
        </div>
      </motion.div>
    )
  }

  // Build chart data array from labels + data
  const chartItems = Array.isArray(labels)
    ? labels.map((label, i) => ({
        name: label,
        value: Array.isArray(data) ? data[i] : 0
      }))
    : []

  if (chartItems.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="w-full mt-3 rounded-xl border border-lyzr-cream bg-white overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-lyzr-light-2 bg-lyzr-light-1">
        <div className="w-8 h-8 rounded-lg bg-lyzr-congo/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-lyzr-congo" />
        </div>
        <h4 className="font-medium text-sm text-lyzr-congo">{title}</h4>
      </div>

      {/* Chart */}
      <div className="px-6 py-6">
        {chart_type === 'pie' && (
          <ResponsiveContainer width={500} height={500}>
            <PieChart>
              <Pie
                data={chartItems}
                cx="50%"
                cy="45%"
                outerRadius={170}
                innerRadius={80}
                dataKey="value"
                paddingAngle={2}
                label={chartItems.length <= 8 ? ({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)` : false}
                labelLine={chartItems.length <= 8}
              >
                {chartItems.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value) => <span className="text-lyzr-congo">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}

        {chart_type === 'bar' && (
          <ResponsiveContainer width={500} height={500}>
            <BarChart data={chartItems} margin={{ top: 10, right: 30, bottom: 80, left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3D0C2" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#71514F' }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tick={{ fontSize: 11, fill: '#71514F' }} tickFormatter={formatValue} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartItems.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}

        {chart_type === 'line' && (
          <ResponsiveContainer width={500} height={500}>
            <AreaChart data={chartItems} margin={{ top: 10, right: 30, bottom: 80, left: 30 }}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4A2F2D" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4A2F2D" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3D0C2" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#71514F' }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tick={{ fontSize: 11, fill: '#71514F' }} tickFormatter={formatValue} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#4A2F2D"
                strokeWidth={2}
                fill="url(#lineGradient)"
                dot={{ fill: '#4A2F2D', r: 4 }}
                activeDot={{ r: 6, fill: '#71514F' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  )
}
