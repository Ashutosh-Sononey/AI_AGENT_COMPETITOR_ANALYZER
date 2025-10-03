export interface CompetitorAnalysis {
  id: string
  name: string
  marketShare: number
  growthRate: number
  threatLevel: "Low" | "Medium" | "High" | "Critical"
  strengths: string[]
  weaknesses: string[]
  recentMoves: Array<{
    date: string
    title: string
    impact: "positive" | "negative" | "neutral"
  }>
  features: Array<{
    name: string
    status: "Has" | "Missing" | "Planned"
    category: string
  }>
  pricing: {
    model: string
    startingPrice: string
    enterprise: boolean
  }
  customerSentiment: number
  socialMedia: {
    followers: number
    engagement: number
    mentions: number
  }
  geographicPresence: {
    northAmerica: number
    europe: number
    asia: number
    southAmerica: number
    africa: number
    oceania: number
  }
}

// Generate deterministic but varied data based on company name
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

function seededRandom(seed: number, min: number, max: number): number {
  const x = Math.sin(seed++) * 10000
  const random = x - Math.floor(x)
  return Math.floor(random * (max - min + 1)) + min
}

export function generateCompetitorAnalysis(competitorName: string): CompetitorAnalysis {
  const seed = hashString(competitorName)
  const id = competitorName.toLowerCase().replace(/\s+/g, "-")

  const featureCategories = [
    "Collaboration",
    "AI/ML",
    "Analytics",
    "Integration",
    "Mobile",
    "Security",
    "Customization",
    "Automation",
  ]

  const features = featureCategories.map((category, idx) => ({
    name: `${category} Tools`,
    status: (["Has", "Missing", "Planned"] as const)[seededRandom(seed + idx, 0, 2)],
    category,
  }))

  const strengthsPool = [
    "Strong brand recognition",
    "Extensive feature set",
    "Large user base",
    "Excellent customer support",
    "Competitive pricing",
    "Advanced AI capabilities",
    "Robust API ecosystem",
    "Enterprise-grade security",
    "Intuitive user interface",
    "Fast performance",
  ]

  const weaknessesPool = [
    "High pricing for small teams",
    "Steep learning curve",
    "Limited mobile features",
    "Slow customer support",
    "Complex pricing structure",
    "Outdated UI design",
    "Limited integrations",
    "Performance issues at scale",
    "Lack of customization",
    "Poor documentation",
  ]

  const marketShare = seededRandom(seed, 5, 35)
  const growthRate = seededRandom(seed + 1, -5, 45)
  const threatLevel = marketShare > 25 ? "Critical" : marketShare > 15 ? "High" : marketShare > 8 ? "Medium" : "Low"

  return {
    id,
    name: competitorName,
    marketShare,
    growthRate,
    threatLevel,
    strengths: [
      strengthsPool[seededRandom(seed + 2, 0, strengthsPool.length - 1)],
      strengthsPool[seededRandom(seed + 3, 0, strengthsPool.length - 1)],
      strengthsPool[seededRandom(seed + 4, 0, strengthsPool.length - 1)],
    ],
    weaknesses: [
      weaknessesPool[seededRandom(seed + 5, 0, weaknessesPool.length - 1)],
      weaknessesPool[seededRandom(seed + 6, 0, weaknessesPool.length - 1)],
    ],
    recentMoves: [
      {
        date: "2024-12-15",
        title: `${competitorName} launches new AI feature`,
        impact: "positive",
      },
      {
        date: "2024-11-28",
        title: `${competitorName} raises Series ${String.fromCharCode(65 + seededRandom(seed + 7, 0, 5))} funding`,
        impact: "positive",
      },
      {
        date: "2024-10-10",
        title: `${competitorName} experiences service outage`,
        impact: "negative",
      },
    ],
    features,
    pricing: {
      model: ["Freemium", "Subscription", "Per-seat", "Usage-based"][seededRandom(seed + 8, 0, 3)],
      startingPrice: `$${seededRandom(seed + 9, 9, 99)}/mo`,
      enterprise: seededRandom(seed + 10, 0, 1) === 1,
    },
    customerSentiment: seededRandom(seed + 11, 60, 95),
    socialMedia: {
      followers: seededRandom(seed + 12, 10000, 500000),
      engagement: seededRandom(seed + 13, 2, 8),
      mentions: seededRandom(seed + 14, 500, 5000),
    },
    geographicPresence: {
      northAmerica: seededRandom(seed + 15, 60, 95),
      europe: seededRandom(seed + 16, 50, 90),
      asia: seededRandom(seed + 17, 40, 85),
      southAmerica: seededRandom(seed + 18, 20, 60),
      africa: seededRandom(seed + 19, 10, 40),
      oceania: seededRandom(seed + 20, 30, 70),
    },
  }
}

export function generateMarketTrends(competitors: string[]) {
  const quarters = ["Q1 2024", "Q2 2024", "Q3 2024", "Q4 2024", "Q1 2025", "Q2 2025", "Q3 2025"]

  return quarters.map((quarter, idx) => {
    const data: any = { quarter }

    competitors.forEach((comp) => {
      const seed = hashString(comp + quarter)
      const baseValue = seededRandom(seed, 80, 100)
      const growth = idx * seededRandom(seed + 1, 2, 8)
      data[comp.toLowerCase().replace(/\s+/g, "-")] = baseValue + growth
    })

    return data
  })
}

export function generateFeatureComparison(competitors: string[]) {
  const features = [
    "Real-time Collaboration",
    "AI-Powered Design",
    "Version Control",
    "Cloud Storage",
    "Mobile App",
    "API Access",
    "Custom Branding",
    "Advanced Analytics",
    "Team Management",
    "Third-party Integrations",
  ]

  return features.map((feature) => {
    const row: any = { feature }

    competitors.forEach((comp) => {
      const seed = hashString(comp + feature)
      row[comp.toLowerCase().replace(/\s+/g, "-")] = seededRandom(seed, 0, 1) === 1
    })

    return row
  })
}

export function generateUpcomingEvents(competitors: string[]) {
  if (competitors.length === 0) {
    return [
      {
        title: "Tech Conference 2025",
        date: "Jan 15-17, San Francisco",
        description: "Annual technology conference",
      },
      {
        title: "Product Launch Webinar",
        date: "Jan 20, Online",
        description: "New product announcements",
      },
    ]
  }

  const events = []
  competitors.forEach((comp, idx) => {
    const seed = hashString(comp)
    const dayOffset = seededRandom(seed + idx, 5, 30)
    events.push({
      title: `${comp} Product Launch Event`,
      date: `Jan ${dayOffset}, ${seededRandom(seed, 0, 1) === 0 ? "Online" : "New York"}`,
      description: `${comp} is expected to announce new features`,
    })
  })

  return events.slice(0, 3)
}

export function generateCompetitorGaps(competitors: string[]) {
  if (competitors.length === 0) {
    return []
  }

  const gapsPool = [
    { title: "Mobile App Experience", description: "Limited mobile functionality compared to competitors" },
    { title: "Integration Ecosystem", description: "Fewer third-party integrations available" },
    { title: "Advanced Analytics", description: "Basic analytics compared to market leaders" },
    { title: "Collaboration Tools", description: "Real-time collaboration needs improvement" },
    { title: "AI Capabilities", description: "AI features lag behind competitors" },
    { title: "Customer Support", description: "24/7 support not yet available" },
  ]

  const gaps = []
  competitors.forEach((comp, idx) => {
    const seed = hashString(comp)
    const gapIdx = seededRandom(seed + idx, 0, gapsPool.length - 1)
    if (!gaps.find((g) => g.title === gapsPool[gapIdx].title)) {
      gaps.push({
        ...gapsPool[gapIdx],
        competitor: comp,
      })
    }
  })

  return gaps.slice(0, 3)
}

export function generateWeeklyActivity(competitors: string[]) {
  if (competitors.length === 0) {
    return []
  }

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const seed = hashString(competitors.join(","))

  return days.map((day, idx) => {
    // Generate activity based on all competitors combined
    const baseActivity = seededRandom(seed + idx, 20, 50)
    const competitorBoost = competitors.length * seededRandom(seed + idx + 100, 5, 15)
    return {
      day,
      activity: Math.min(100, baseActivity + competitorBoost),
    }
  })
}

export function generateAlerts(competitors: string[]) {
  const alertTypes = ["feature", "news", "prediction"] as const
  const alerts = []

  competitors.forEach((comp, idx) => {
    const seed = hashString(comp + "alert")
    const type = alertTypes[seededRandom(seed, 0, alertTypes.length - 1)]
    const hoursAgo = seededRandom(seed + 1, 1, 48)

    let title = ""
    let description = ""

    if (type === "feature") {
      title = `${comp} just added AI Analytics feature!`
      description = "New machine learning dashboard with predictive insights"
    } else if (type === "news") {
      title = `${comp} announced partnership`
      description = "Strategic alliance with major cloud provider"
    } else {
      title = `Market shift detected in ${comp}'s sector`
      description = `${seededRandom(seed + 2, 10, 25)}% growth predicted in next quarter`
    }

    alerts.push({
      id: `${comp}-${idx}`,
      title,
      description,
      timestamp: hoursAgo < 24 ? `${hoursAgo} hours ago` : `${Math.floor(hoursAgo / 24)} days ago`,
      read: seededRandom(seed + 3, 0, 1) === 1,
      type,
      competitor: comp,
    })
  })

  return alerts
}

export function generateReports(competitors: string[]) {
  if (competitors.length === 0) {
    return {
      totalReports: 0,
      insightsGenerated: 0,
      marketPosition: "N/A",
      growthRate: 0,
    }
  }

  const seed = hashString(competitors.join(","))
  return {
    totalReports: competitors.length * seededRandom(seed, 3, 8),
    insightsGenerated: competitors.length * seededRandom(seed + 1, 20, 50),
    marketPosition: seededRandom(seed + 2, 1, 5),
    growthRate: seededRandom(seed + 3, 15, 45),
  }
}
