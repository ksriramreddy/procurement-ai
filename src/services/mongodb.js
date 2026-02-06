/**
 * MongoDB service for vendor queries
 * Note: Direct browser connection to MongoDB is not recommended for production.
 * This implementation uses fetch to call a hypothetical backend API.
 * For demo purposes, we'll simulate the MongoDB query logic.
 */

const MONGODB_URI = import.meta.env.VITE_MONGODB_URI ||
  'mongodb+srv://ksriramreddy9:ksriramreddy9@cluster0.v5pt4oo.mongodb.net/?appName=Cluster0'

// Mock vendor data for demonstration (based on the provided schema)
const MOCK_VENDORS = [
  {
    vendor_profile: {
      vendor_id: "VEND-ACME-001",
      vendor_name: "Acme Cloud Technologies",
      vendor_type: "Cloud Services & Enterprise IT",
      status: "Active",
      founded_year: 2016,
      headquarters: {
        address: "San Jose, California, USA",
        country: "United States"
      },
      contact_details: {
        primary_contact_name: "Jane Smith",
        contact_email: "sales@acmecloudtech.com",
        contact_phone: "+1-408-555-0198",
        support_email: "support@acmecloudtech.com"
      },
      website: "https://www.acmecloudtech.com"
    },
    services_offered: [
      {
        service_category: "Cloud Infrastructure",
        services: ["Compute Services", "Object Storage", "Managed Databases", "Kubernetes Hosting"]
      },
      {
        service_category: "Security",
        services: ["Cloud Security Posture Management", "IAM Integration", "Data Encryption Services"]
      }
    ],
    certifications_and_compliance: {
      certifications: ["ISO 27001", "SOC 2 Type II", "GDPR Compliant"],
      regulatory_coverage: ["GDPR", "CCPA"],
      last_audit_date: "2025-10-12"
    },
    commercial_details: {
      pricing_models: ["Subscription", "Usage-based"],
      average_contract_value_usd: 350000,
      minimum_contract_value_usd: 50000,
      maximum_contract_value_usd: 2000000,
      supported_currencies: ["USD", "EUR", "INR"]
    },
    performance_metrics: {
      average_sla_uptime_percent: 99.95,
      average_response_time_minutes: 18,
      customer_satisfaction_score: 4.6
    },
    risk_and_compliance_scores: {
      risk_score: 22,
      compliance_score: 92,
      last_reviewed: "2026-01-28",
      risk_level: "Low"
    },
    vendor_summary: {
      preferred_vendor_status: true,
      eligible_for_future_rfqs: true,
      notes: "Strong compliance posture and consistent SLA performance across enterprise clients."
    }
  },
  {
    vendor_profile: {
      vendor_id: "VEND-CYBER-002",
      vendor_name: "CyberShield Solutions",
      vendor_type: "Cybersecurity Services",
      status: "Active",
      founded_year: 2018,
      headquarters: {
        address: "Austin, Texas, USA",
        country: "United States"
      },
      contact_details: {
        primary_contact_name: "Michael Chen",
        contact_email: "enterprise@cybershield.io",
        contact_phone: "+1-512-555-0234"
      },
      website: "https://www.cybershield.io"
    },
    services_offered: [
      {
        service_category: "Cybersecurity",
        services: ["Endpoint Detection & Response", "Threat Intelligence", "Incident Response", "Penetration Testing"]
      },
      {
        service_category: "Managed Services",
        services: ["24/7 SOC", "SIEM Management", "Vulnerability Assessment"]
      }
    ],
    certifications_and_compliance: {
      certifications: ["ISO 27001", "SOC 2 Type II", "PCI DSS"],
      regulatory_coverage: ["HIPAA", "GDPR", "SOX"],
      last_audit_date: "2025-11-20"
    },
    commercial_details: {
      pricing_models: ["Subscription", "Per-endpoint"],
      average_contract_value_usd: 500000,
      minimum_contract_value_usd: 100000,
      maximum_contract_value_usd: 5000000,
      supported_currencies: ["USD", "EUR", "GBP"]
    },
    performance_metrics: {
      average_sla_uptime_percent: 99.99,
      average_response_time_minutes: 15,
      customer_satisfaction_score: 4.8
    },
    risk_and_compliance_scores: {
      risk_score: 15,
      compliance_score: 98,
      last_reviewed: "2026-01-15",
      risk_level: "Low"
    },
    vendor_summary: {
      preferred_vendor_status: true,
      eligible_for_future_rfqs: true,
      notes: "Industry-leading cybersecurity provider with excellent response times."
    }
  },
  {
    vendor_profile: {
      vendor_id: "VEND-CONS-003",
      vendor_name: "Nexus Consulting Group",
      vendor_type: "IT Consulting & Professional Services",
      status: "Active",
      founded_year: 2010,
      headquarters: {
        address: "New York, NY, USA",
        country: "United States"
      },
      contact_details: {
        primary_contact_name: "Sarah Williams",
        contact_email: "partnerships@nexusconsulting.com",
        contact_phone: "+1-212-555-0456"
      },
      website: "https://www.nexusconsulting.com"
    },
    services_offered: [
      {
        service_category: "Consulting",
        services: ["Digital Transformation", "IT Strategy", "Change Management", "Process Optimization"]
      },
      {
        service_category: "Implementation",
        services: ["ERP Implementation", "Cloud Migration", "System Integration"]
      }
    ],
    certifications_and_compliance: {
      certifications: ["ISO 9001", "CMMI Level 5", "PMP Certified Team"],
      regulatory_coverage: ["SOX", "GDPR"],
      last_audit_date: "2025-09-30"
    },
    commercial_details: {
      pricing_models: ["Time & Materials", "Fixed Price", "Retainer"],
      average_contract_value_usd: 750000,
      minimum_contract_value_usd: 150000,
      maximum_contract_value_usd: 10000000,
      supported_currencies: ["USD", "EUR", "GBP", "INR"]
    },
    performance_metrics: {
      average_sla_uptime_percent: null,
      average_response_time_minutes: 30,
      customer_satisfaction_score: 4.5
    },
    risk_and_compliance_scores: {
      risk_score: 28,
      compliance_score: 88,
      last_reviewed: "2026-01-10",
      risk_level: "Low"
    },
    vendor_summary: {
      preferred_vendor_status: true,
      eligible_for_future_rfqs: true,
      notes: "Trusted consulting partner with deep enterprise experience."
    }
  },
  {
    vendor_profile: {
      vendor_id: "VEND-HW-004",
      vendor_name: "TechPro Hardware Solutions",
      vendor_type: "Hardware & Device Provider",
      status: "Active",
      founded_year: 2012,
      headquarters: {
        address: "Bangalore, Karnataka, India",
        country: "India"
      },
      contact_details: {
        primary_contact_name: "Rajesh Kumar",
        contact_email: "enterprise@techprohw.com",
        contact_phone: "+91-80-555-0789"
      },
      website: "https://www.techprohw.com"
    },
    services_offered: [
      {
        service_category: "Hardware",
        services: ["Enterprise Laptops", "Workstations", "Servers", "Networking Equipment"]
      },
      {
        service_category: "Support Services",
        services: ["Device Leasing", "Extended Warranty", "On-site Support", "Asset Management"]
      }
    ],
    certifications_and_compliance: {
      certifications: ["ISO 9001", "ISO 14001", "Dell Platinum Partner", "HP Enterprise Partner"],
      regulatory_coverage: ["BIS", "CE"],
      last_audit_date: "2025-08-15"
    },
    commercial_details: {
      pricing_models: ["Purchase", "Lease", "Device-as-a-Service"],
      average_contract_value_usd: 450000,
      minimum_contract_value_usd: 25000,
      maximum_contract_value_usd: 3000000,
      supported_currencies: ["USD", "INR"]
    },
    performance_metrics: {
      average_sla_uptime_percent: null,
      average_response_time_minutes: 45,
      customer_satisfaction_score: 4.3
    },
    risk_and_compliance_scores: {
      risk_score: 35,
      compliance_score: 82,
      last_reviewed: "2026-01-20",
      risk_level: "Medium"
    },
    vendor_summary: {
      preferred_vendor_status: true,
      eligible_for_future_rfqs: true,
      notes: "Reliable hardware provider with strong presence in India."
    }
  },
  {
    vendor_profile: {
      vendor_id: "VEND-SAAS-005",
      vendor_name: "Workflow Dynamics",
      vendor_type: "SaaS & Collaboration Tools",
      status: "Active",
      founded_year: 2015,
      headquarters: {
        address: "San Francisco, CA, USA",
        country: "United States"
      },
      contact_details: {
        primary_contact_name: "Emily Johnson",
        contact_email: "sales@workflowdynamics.com",
        contact_phone: "+1-415-555-0321"
      },
      website: "https://www.workflowdynamics.com"
    },
    services_offered: [
      {
        service_category: "SaaS",
        services: ["Project Management", "Team Collaboration", "Document Management", "Workflow Automation"]
      },
      {
        service_category: "Integration",
        services: ["API Services", "Custom Integrations", "SSO Setup"]
      }
    ],
    certifications_and_compliance: {
      certifications: ["SOC 2 Type II", "ISO 27001", "GDPR Compliant"],
      regulatory_coverage: ["GDPR", "CCPA", "HIPAA"],
      last_audit_date: "2025-12-01"
    },
    commercial_details: {
      pricing_models: ["Per-user Subscription", "Enterprise License"],
      average_contract_value_usd: 120000,
      minimum_contract_value_usd: 10000,
      maximum_contract_value_usd: 800000,
      supported_currencies: ["USD", "EUR", "GBP", "AUD"]
    },
    performance_metrics: {
      average_sla_uptime_percent: 99.9,
      average_response_time_minutes: 20,
      customer_satisfaction_score: 4.7
    },
    risk_and_compliance_scores: {
      risk_score: 18,
      compliance_score: 95,
      last_reviewed: "2026-01-25",
      risk_level: "Low"
    },
    vendor_summary: {
      preferred_vendor_status: true,
      eligible_for_future_rfqs: true,
      notes: "Modern SaaS platform with excellent uptime and user experience."
    }
  }
]

/**
 * Query vendors from MongoDB (simulated)
 * @param {Object} query - Query parameters
 * @param {string[]} query.vendorNames - Vendor names to search
 * @param {string[]} query.categories - Service categories to search
 * @returns {Promise<Object[]>} - Matching vendors
 */
export async function queryVendors({ vendorNames = [], categories = [] }) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500))

  // Build regex patterns
  const vendorRegex = vendorNames.length > 0
    ? new RegExp(vendorNames.join('|'), 'i')
    : null

  const categoryRegex = categories.length > 0
    ? new RegExp(categories.join('|'), 'i')
    : null

  // Filter vendors based on query
  const results = MOCK_VENDORS.filter(vendor => {
    // Check vendor name match
    const nameMatch = vendorRegex
      ? vendorRegex.test(vendor.vendor_profile.vendor_name)
      : true

    // Check category match
    const categoryMatch = categoryRegex
      ? vendor.services_offered.some(service =>
          categoryRegex.test(service.service_category) ||
          service.services.some(s => categoryRegex.test(s))
        )
      : true

    // Return true if either matches (OR logic)
    if (vendorRegex && categoryRegex) {
      return nameMatch || categoryMatch
    }

    return nameMatch && categoryMatch
  })

  return results
}

/**
 * Get all vendors
 */
export async function getAllVendors() {
  await new Promise(resolve => setTimeout(resolve, 300))
  return MOCK_VENDORS
}

/**
 * Get vendor by ID
 */
export async function getVendorById(vendorId) {
  await new Promise(resolve => setTimeout(resolve, 200))
  return MOCK_VENDORS.find(v => v.vendor_profile.vendor_id === vendorId) || null
}

/**
 * Transform vendor data for display
 */
export function transformVendorForDisplay(vendor) {
  if (!vendor) return null

  const profile = vendor.vendor_profile
  const services = vendor.services_offered || []
  const compliance = vendor.certifications_and_compliance || {}
  const commercial = vendor.commercial_details || {}
  const performance = vendor.performance_metrics || {}
  const risk = vendor.risk_and_compliance_scores || {}
  const summary = vendor.vendor_summary || {}

  return {
    id: profile.vendor_id,
    name: profile.vendor_name,
    type: profile.vendor_type,
    status: profile.status,
    foundedYear: profile.founded_year,
    headquarters: profile.headquarters?.country || 'N/A',
    address: profile.headquarters?.address || 'N/A',
    website: profile.website,
    contact: {
      name: profile.contact_details?.primary_contact_name,
      email: profile.contact_details?.contact_email,
      phone: profile.contact_details?.contact_phone
    },
    categories: services.map(s => s.service_category),
    allServices: services.flatMap(s => s.services),
    certifications: compliance.certifications || [],
    regulatoryCoverage: compliance.regulatory_coverage || [],
    lastAuditDate: compliance.last_audit_date,
    pricingModels: commercial.pricing_models || [],
    avgContractValue: commercial.average_contract_value_usd,
    minContractValue: commercial.minimum_contract_value_usd,
    maxContractValue: commercial.maximum_contract_value_usd,
    currencies: commercial.supported_currencies || [],
    slaUptime: performance.average_sla_uptime_percent,
    responseTime: performance.average_response_time_minutes,
    satisfactionScore: performance.customer_satisfaction_score,
    riskScore: risk.risk_score,
    riskLevel: risk.risk_level,
    complianceScore: risk.compliance_score,
    lastReviewed: risk.last_reviewed,
    isPreferred: summary.preferred_vendor_status,
    eligibleForRfq: summary.eligible_for_future_rfqs,
    notes: summary.notes
  }
}
