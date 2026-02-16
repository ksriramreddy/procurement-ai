import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ContractPieChart({ data }) {
  const [hoveredSegment, setHoveredSegment] = useState(null)

  const total = data.reduce((sum, item) => sum + item.count, 0)

  // Calculate pie segments
  let currentAngle = -90 // Start from top
  const segments = data.map(item => {
    const percentage = (item.count / total) * 100
    const angle = (item.count / total) * 360
    const segment = {
      ...item,
      percentage,
      startAngle: currentAngle,
      endAngle: currentAngle + angle
    }
    currentAngle += angle
    return segment
  })

  // Convert polar to cartesian coordinates
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    }
  }

  // Create SVG arc path
  const createArcPath = (startAngle, endAngle, innerRadius, outerRadius) => {
    const center = 100
    const start = polarToCartesian(center, center, outerRadius, endAngle)
    const end = polarToCartesian(center, center, outerRadius, startAngle)
    const innerStart = polarToCartesian(center, center, innerRadius, endAngle)
    const innerEnd = polarToCartesian(center, center, innerRadius, startAngle)

    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1

    return [
      `M ${start.x} ${start.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart.x} ${innerStart.y}`,
      'Z'
    ].join(' ')
  }

  return (
    <div className="flex items-center justify-between gap-6">
      {/* Pie Chart */}
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {segments.map((segment, index) => {
            const isHovered = hoveredSegment === index
            const innerRadius = 50
            const outerRadius = isHovered ? 85 : 80

            return (
              <motion.path
                key={segment.status}
                d={createArcPath(segment.startAngle, segment.endAngle, innerRadius, outerRadius)}
                fill={segment.color}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: hoveredSegment === null || isHovered ? 1 : 0.5,
                  scale: isHovered ? 1.02 : 1
                }}
                transition={{ duration: 0.2 }}
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
                className="cursor-pointer"
                style={{ transformOrigin: '100px 100px' }}
              />
            )
          })}

          {/* Center text */}
          <text x="100" y="95" textAnchor="middle" className="fill-lyzr-congo font-semibold text-2xl">
            {total}
          </text>
          <text x="100" y="115" textAnchor="middle" className="fill-lyzr-mid-4 text-xs">
            Total
          </text>
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {hoveredSegment !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
            >
              <div className="bg-lyzr-congo text-white text-xs rounded-lg p-3 shadow-lg min-w-[140px] text-center">
                <div
                  className="w-3 h-3 rounded-full mx-auto mb-2"
                  style={{ backgroundColor: segments[hoveredSegment].color }}
                />
                <p className="font-semibold text-sm">{segments[hoveredSegment].status}</p>
                <p className="text-lg font-bold mt-1">{segments[hoveredSegment].count}</p>
                <p className="text-lyzr-cream text-[10px]">
                  {segments[hoveredSegment].percentage.toFixed(1)}% of total
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {segments.map((segment, index) => (
          <motion.div
            key={segment.status}
            className={`flex items-center gap-3 cursor-pointer transition-opacity ${
              hoveredSegment !== null && hoveredSegment !== index ? 'opacity-50' : ''
            }`}
            onMouseEnter={() => setHoveredSegment(index)}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm text-lyzr-congo">{segment.status}</span>
                <span className="text-sm font-semibold text-lyzr-congo">{segment.count}</span>
              </div>
              <div className="w-full bg-lyzr-light-2 rounded-full h-1.5 mt-1">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${segment.percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: segment.color }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
