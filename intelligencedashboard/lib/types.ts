export interface Competitor {
  id: string
  name: string
  description: string
  logo: string
  industry: string
  website?: string
}

export interface Feature {
  name: string
  yourStartup: "Available" | "Limited" | "Not Available" | string
  competitors: Record<string, "Available" | "Limited" | "Not Available" | string>
}

export interface Prediction {
  id: string
  title: string
  quarter: string
  impact: "High Impact" | "Medium Impact" | "Low Impact"
  source?: string
}

export interface Insight {
  id: string
  type: "first" | "planning" | "lacks"
  title: string
  description: string
  icon: string
}

export interface Alert {
  id: string
  title: string
  description: string
  timestamp: string
  read: boolean
  type: "feature" | "news" | "prediction"
}
