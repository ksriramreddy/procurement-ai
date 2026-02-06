import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Clock, FileText, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import BudgetSpendChart from './BudgetSpendChart'
import ContractPieChart from './ContractPieChart'
import QuickViewTable from './QuickViewTable'

// Synthetic data
const statsData = [
  {
    label: 'Vendors Active',
    value: 18,
    change: '+3',
    trend: 'up',
    icon: Users,
    color: 'bg-accent-success/10',
    iconColor: 'text-accent-success'
  },
  {
    label: 'Pending Review',
    value: 33,
    change: '-5',
    trend: 'down',
    icon: Clock,
    color: 'bg-accent-warning/10',
    iconColor: 'text-accent-warning'
  },
  {
    label: 'Contracts Active',
    value: 142,
    change: '+12',
    trend: 'up',
    icon: FileText,
    color: 'bg-accent-cool/10',
    iconColor: 'text-accent-cool'
  },
  {
    label: 'Expiring Soon',
    value: 11,
    change: '+2',
    trend: 'up',
    icon: AlertTriangle,
    color: 'bg-accent-error/10',
    iconColor: 'text-accent-error'
  }
]

const budgetSpendData = [
  { category: 'SaaS', budget: 150000, spend: 125000, company: 'Salesforce, HubSpot, Slack' },
  { category: 'Services', budget: 200000, spend: 180000, company: 'Accenture, Deloitte, IBM' },
  { category: 'Hardware', budget: 80000, spend: 72000, company: 'Dell, HP, Lenovo' },
  { category: 'Security', budget: 100000, spend: 95000, company: 'CrowdStrike, Palo Alto, Okta' }
]

const contractDistribution = [
  { status: 'Draft', count: 77, color: '#CFA031' },
  { status: 'Active', count: 142, color: '#3D8C6C' },
  { status: 'Expiring', count: 11, color: '#EC7843' },
  { status: 'Expired', count: 1, color: '#C84658' }
]

const quickViewData = [
  { id: 'CNT-001', vendor: 'Salesforce', type: 'SaaS', value: '$45,000', status: 'Active', expiry: '2024-12-15' },
  { id: 'CNT-002', vendor: 'Accenture', type: 'Services', value: '$120,000', status: 'Active', expiry: '2024-11-30' },
  { id: 'CNT-003', vendor: 'Dell Technologies', type: 'Hardware', value: '$35,000', status: 'Expiring', expiry: '2024-03-20' },
  { id: 'CNT-004', vendor: 'CrowdStrike', type: 'Security', value: '$28,000', status: 'Active', expiry: '2025-06-01' },
  { id: 'CNT-005', vendor: 'HubSpot', type: 'SaaS', value: '$18,000', status: 'Draft', expiry: '-' }
]

export default function Dashboard() {
  return (
    <div className="flex-1 flex flex-col h-full bg-lyzr-white-amber overflow-auto">
      {/* Header */}
      <header className="px-6 py-4 border-b border-lyzr-cream bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <h1 className="font-playfair text-xl font-semibold text-lyzr-congo">
          Procurement Dashboard
        </h1>
        <p className="text-sm text-lyzr-mid-4 mt-1">Overview of your procurement activities</p>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl border border-lyzr-cream p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  stat.trend === 'up' ? 'text-accent-success' : 'text-accent-error'
                }`}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-semibold text-lyzr-congo">{stat.value}</p>
                <p className="text-sm text-lyzr-mid-4">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budget vs Spend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl border border-lyzr-cream p-5"
          >
            <h2 className="font-playfair text-lg font-semibold text-lyzr-congo mb-4">
              Budget vs Spend
            </h2>
            <BudgetSpendChart data={budgetSpendData} />
          </motion.div>

          {/* Contract Distribution Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl border border-lyzr-cream p-5"
          >
            <h2 className="font-playfair text-lg font-semibold text-lyzr-congo mb-4">
              Contract Distribution
            </h2>
            <ContractPieChart data={contractDistribution} />
          </motion.div>
        </div>

        {/* Quick View Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl border border-lyzr-cream overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-lyzr-cream">
            <h2 className="font-playfair text-lg font-semibold text-lyzr-congo">
              Quick View - Recent Contracts
            </h2>
          </div>
          <QuickViewTable data={quickViewData} />
        </motion.div>
      </div>
    </div>
  )
}
