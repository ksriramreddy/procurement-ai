import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function BudgetSpendChart({ data }) {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })

  const maxValue = Math.max(...data.flatMap(d => [d.budget, d.spend]))
  const chartHeight = 200

  const handleMouseMove = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltipPosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setHoveredIndex(index)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="relative">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 h-[200px] flex flex-col justify-between text-xs text-lyzr-mid-4 pr-2">
        <span>{formatCurrency(maxValue)}</span>
        <span>{formatCurrency(maxValue / 2)}</span>
        <span>$0</span>
      </div>

      {/* Chart area */}
      <div className="ml-16 relative">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2].map(i => (
            <div key={i} className="border-t border-lyzr-light-2 w-full" />
          ))}
        </div>

        {/* Bars */}
        <div className="flex items-end justify-around h-[200px] gap-4 relative">
          {data.map((item, index) => {
            const budgetHeight = (item.budget / maxValue) * chartHeight
            const spendHeight = (item.spend / maxValue) * chartHeight
            const spendPercentage = ((item.spend / item.budget) * 100).toFixed(1)

            return (
              <div
                key={item.category}
                className="flex-1 flex flex-col items-center relative"
                onMouseMove={(e) => handleMouseMove(e, index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Bar group */}
                <div className="flex items-end gap-1 h-full cursor-pointer">
                  {/* Budget bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: budgetHeight }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`w-8 rounded-t-md transition-opacity ${
                      hoveredIndex === index ? 'bg-lyzr-ferra' : 'bg-lyzr-ferra/70'
                    }`}
                  />
                  {/* Spend bar */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: spendHeight }}
                    transition={{ duration: 0.5, delay: index * 0.1 + 0.1 }}
                    className={`w-8 rounded-t-md transition-opacity ${
                      hoveredIndex === index ? 'bg-accent-cool' : 'bg-accent-cool/70'
                    }`}
                  />
                </div>

                {/* Category label */}
                <span className="text-xs text-lyzr-mid-4 mt-2 text-center">
                  {item.category}
                </span>

                {/* Tooltip */}
                <AnimatePresence>
                  {hoveredIndex === index && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20"
                    >
                      <div className="bg-lyzr-congo text-white text-xs rounded-lg p-3 shadow-lg min-w-[180px]">
                        <p className="font-semibold text-sm mb-2">{item.category}</p>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-lyzr-cream">Budget:</span>
                            <span className="font-medium">{formatCurrency(item.budget)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-lyzr-cream">Spend:</span>
                            <span className="font-medium">{formatCurrency(item.spend)}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-lyzr-cream">Utilization:</span>
                            <span className="font-medium">{spendPercentage}%</span>
                          </div>
                          <div className="pt-2 mt-2 border-t border-white/20">
                            <span className="text-lyzr-cream text-[10px]">Top vendors:</span>
                            <p className="text-[10px] mt-0.5">{item.company}</p>
                          </div>
                        </div>
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-lyzr-congo" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-lyzr-light-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-lyzr-ferra" />
            <span className="text-xs text-lyzr-mid-4">Budget</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-accent-cool" />
            <span className="text-xs text-lyzr-mid-4">Spend</span>
          </div>
        </div>
      </div>
    </div>
  )
}
