"use client"

import { useState, useMemo } from "react"
import { Search, ChevronLeft, ChevronRight, MapPin, Globe, Download, TrendingUp, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Bar,
  BarChart,
  Tooltip,
  Legend,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useCompetitors } from "@/lib/competitor-context"
import { generateCompetitorAnalysis, generateMarketTrends } from "@/lib/mock-backend"
import { WorldMap } from "@/components/world-map"

const predictions = [
  {
    id: "1",
    title: "Increased Adoption of Electric Vehicles",
    quarter: "2024-Q4",
    impact: "High Impact" as const,
    probability: 87,
    category: "Automotive",
    description: "Major automakers accelerating EV production with new battery technologies",
    affectedRegions: ["North America", "Europe", "Asia"],
  },
  {
    id: "2",
    title: "Growth in AI-driven Personalized Healthcare",
    quarter: "2025-Q1",
    impact: "Medium Impact" as const,
    probability: 72,
    category: "Healthcare",
    description: "AI diagnostics and personalized treatment plans becoming mainstream",
    affectedRegions: ["North America", "Europe"],
  },
  {
    id: "3",
    title: "Expansion of the Metaverse in Retail",
    quarter: "2025-Q2",
    impact: "Low Impact" as const,
    probability: 54,
    category: "Retail",
    description: "Virtual shopping experiences gaining traction among younger demographics",
    affectedRegions: ["Global"],
  },
  {
    id: "4",
    title: "Rise of Quantum Computing Applications",
    quarter: "2025-Q3",
    impact: "High Impact" as const,
    probability: 91,
    category: "Technology",
    description: "Breakthrough in quantum error correction enabling commercial applications",
    affectedRegions: ["North America", "Asia"],
  },
  {
    id: "5",
    title: "Sustainable Energy Storage Solutions",
    quarter: "2025-Q4",
    impact: "Medium Impact" as const,
    probability: 78,
    category: "Energy",
    description: "Next-gen battery technologies reducing renewable energy storage costs",
    affectedRegions: ["Global"],
  },
  {
    id: "6",
    title: "Blockchain in Supply Chain Management",
    quarter: "2026-Q1",
    impact: "Medium Impact" as const,
    probability: 65,
    category: "Logistics",
    description: "Enterprise adoption of blockchain for transparency and traceability",
    affectedRegions: ["North America", "Europe", "Asia"],
  },
  {
    id: "7",
    title: "5G Network Expansion in Rural Areas",
    quarter: "2026-Q2",
    impact: "Low Impact" as const,
    probability: 58,
    category: "Telecommunications",
    description: "Government initiatives driving rural 5G infrastructure development",
    affectedRegions: ["North America", "Europe"],
  },
  {
    id: "8",
    title: "Advanced Robotics in Manufacturing",
    quarter: "2026-Q3",
    impact: "High Impact" as const,
    probability: 84,
    category: "Manufacturing",
    description: "Collaborative robots and AI-driven automation transforming production lines",
    affectedRegions: ["Asia", "North America"],
  },
]

export function MarketAnalysisContent() {
  const { competitors } = useCompetitors()

  const [activeTab, setActiveTab] = useState("trend-graphs")
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCompetitor, setSelectedCompetitor] = useState(competitors[0]?.name || "")
  const [selectedPrediction, setSelectedPrediction] = useState<string | null>(null)
  const [filterImpact, setFilterImpact] = useState<string>("all")

  const competitorAnalyses = useMemo(() => competitors.map((c) => generateCompetitorAnalysis(c.name)), [competitors])

  const chartData = useMemo(() => generateMarketTrends(competitors.map((c) => c.name)), [competitors])

  const chartConfig = useMemo(() => {
    const config: any = {}
    const colors = [
      "hsl(142, 76%, 36%)",
      "hsl(221, 83%, 53%)",
      "hsl(340, 82%, 52%)",
      "hsl(48, 96%, 53%)",
      "hsl(280, 70%, 50%)",
      "hsl(160, 60%, 45%)",
    ]

    competitors.forEach((comp, idx) => {
      const key = comp.name.toLowerCase().replace(/\s+/g, "-")
      config[key] = {
        label: comp.name,
        color: colors[idx % colors.length],
      }
    })

    return config
  }, [competitors])

  const heatmapData = useMemo(() => {
    return competitorAnalyses.map((analysis) => ({
      name: analysis.name,
      tech: seededRandom(hashString(analysis.name + "tech"), 60, 95),
      healthcare: seededRandom(hashString(analysis.name + "healthcare"), 40, 80),
      energy: seededRandom(hashString(analysis.name + "energy"), 50, 85),
      finance: seededRandom(hashString(analysis.name + "finance"), 55, 90),
    }))
  }, [competitorAnalyses])

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
    const x = Math.sin(seed) * 10000
    const random = x - Math.floor(x)
    return Math.floor(random * (max - min + 1)) + min
  }

  const selectedAnalysis = competitorAnalyses.find((a) => a.name === selectedCompetitor) || competitorAnalyses[0]

  const averageGeographicData = useMemo(() => {
    if (competitorAnalyses.length === 0) return {}

    const regions = ["northAmerica", "europe", "asia", "southAmerica", "africa", "oceania"]
    const averages: any = {}

    regions.forEach((region) => {
      const sum = competitorAnalyses.reduce((acc, analysis) => {
        return acc + (analysis.geographicPresence[region as keyof typeof analysis.geographicPresence] || 0)
      }, 0)
      averages[region] = Math.round(sum / competitorAnalyses.length)
    })

    return averages
  }, [competitorAnalyses])

  const itemsPerPage = 3

  const filteredPredictions = predictions.filter((pred) => {
    const matchesSearch =
      pred.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pred.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterImpact === "all" || pred.impact === filterImpact
    return matchesSearch && matchesFilter
  })

  const totalPages = Math.ceil(filteredPredictions.length / itemsPerPage)
  const paginatedPredictions = filteredPredictions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const selectedPredictionData = predictions.find((p) => p.id === selectedPrediction)

  if (competitors.length === 0) {
    return (
      <main className="mx-auto max-w-screen-2xl px-6 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-bold">No Competitors Selected</h2>
            <p className="text-muted-foreground">Please add competitors to view market analysis</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-screen-2xl px-6 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Predictive Market Shift Analyzer</h1>
        <p className="text-muted-foreground">
          AI-powered predictions of upcoming market shifts, emerging trends, and disruptive innovations.
        </p>
      </div>

      <div className="mb-8 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for industries, time frames, or impact levels"
            className="h-12 pl-12"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="h-12 rounded-lg border border-input bg-background px-4 text-sm"
          value={filterImpact}
          onChange={(e) => setFilterImpact(e.target.value)}
        >
          <option value="all">All Impact Levels</option>
          <option value="High Impact">High Impact</option>
          <option value="Medium Impact">Medium Impact</option>
          <option value="Low Impact">Low Impact</option>
        </select>
        <Button variant="outline" className="h-12 px-4 bg-transparent">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="mb-6 flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("trend-graphs")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "trend-graphs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Trend Graphs
        </button>
        <button
          onClick={() => setActiveTab("heatmaps")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "heatmaps"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Heatmaps
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "timeline"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => setActiveTab("geographic")}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "geographic"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Geographic
        </button>
      </div>

      {activeTab === "trend-graphs" && (
        <>
          <div className="mb-4 flex gap-2 flex-wrap">
            {competitors.map((comp) => {
              const key = comp.name.toLowerCase().replace(/\s+/g, "-")
              return (
                <Button
                  key={comp.id}
                  variant={selectedCompetitor === comp.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCompetitor(comp.name)}
                >
                  {comp.name}
                </Button>
              )
            })}
          </div>

          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Predicted Market Growth for {selectedCompetitor}</CardTitle>
                  <CardDescription>Next 2 Years</CardDescription>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">+{selectedAnalysis?.growthRate}%</span>
                    <span className="text-sm font-medium text-green-500">
                      {selectedAnalysis?.marketShare}% market share
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      {Object.entries(chartConfig).map(([key, config]: [string, any]) => (
                        <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={config.color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="quarter" className="text-xs" />
                    <YAxis className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    {competitors.map((comp) => {
                      const key = comp.name.toLowerCase().replace(/\s+/g, "-")
                      return (
                        <Area
                          key={key}
                          type="monotone"
                          dataKey={key}
                          stroke={chartConfig[key]?.color}
                          strokeWidth={selectedCompetitor === comp.name ? 3 : 1}
                          fill={`url(#color${key})`}
                          opacity={selectedCompetitor === comp.name ? 1 : 0.3}
                        />
                      )
                    })}
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>

              <div className="mt-6 grid grid-cols-4 gap-4">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Market Share</p>
                  <p className="text-2xl font-bold">{selectedAnalysis?.marketShare}%</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Growth Rate</p>
                  <p className="text-2xl font-bold text-green-500">+{selectedAnalysis?.growthRate}%</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Threat Level</p>
                  <p className="text-2xl font-bold">{selectedAnalysis?.threatLevel}</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Sentiment</p>
                  <p className="text-2xl font-bold text-amber-500">{selectedAnalysis?.customerSentiment}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Predictions</CardTitle>
              <CardDescription>{filteredPredictions.length} predictions found</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paginatedPredictions.map((prediction) => (
                  <button
                    key={prediction.id}
                    onClick={() => setSelectedPrediction(prediction.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent"
                  >
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <p className="font-medium">{prediction.title}</p>
                        <Badge variant="outline" className="text-xs">
                          {prediction.category}
                        </Badge>
                      </div>
                      <p className="mb-2 text-sm text-muted-foreground">{prediction.description}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">{prediction.quarter}</span>
                        <Badge
                          variant={
                            prediction.impact === "High Impact"
                              ? "destructive"
                              : prediction.impact === "Medium Impact"
                                ? "default"
                                : "secondary"
                          }
                          className={
                            prediction.impact === "High Impact"
                              ? "bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-400"
                              : prediction.impact === "Medium Impact"
                                ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                                : "bg-green-500/10 text-green-600 hover:bg-green-500/20 dark:text-green-400"
                          }
                        >
                          {prediction.impact}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          {prediction.probability}% probability
                        </div>
                      </div>
                    </div>
                    <svg
                      className="h-5 w-5 text-muted-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(page)}
                    className="h-9 w-9"
                  >
                    {page}
                  </Button>
                ))}

                {totalPages > 5 && <span className="px-2 text-muted-foreground">...</span>}

                {totalPages > 5 && (
                  <Button
                    variant={currentPage === totalPages ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(totalPages)}
                    className="h-9 w-9"
                  >
                    {totalPages}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === "heatmaps" && (
        <Card>
          <CardHeader>
            <CardTitle>Regional Market Intensity Heatmap</CardTitle>
            <CardDescription>Market activity and growth potential by region and sector</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                tech: { label: "Technology", color: "hsl(142, 76%, 36%)" },
                healthcare: { label: "Healthcare", color: "hsl(221, 83%, 53%)" },
                energy: { label: "Energy", color: "hsl(340, 82%, 52%)" },
                finance: { label: "Finance", color: "hsl(48, 96%, 53%)" },
              }}
              className="h-[400px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmapData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tech" fill="hsl(142, 76%, 36%)" name="Technology" />
                  <Bar dataKey="healthcare" fill="hsl(221, 83%, 53%)" name="Healthcare" />
                  <Bar dataKey="energy" fill="hsl(340, 82%, 52%)" name="Energy" />
                  <Bar dataKey="finance" fill="hsl(48, 96%, 53%)" name="Finance" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Hottest Region</h3>
                </div>
                <p className="text-2xl font-bold">Asia</p>
                <p className="text-sm text-muted-foreground">Leading in technology sector</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <h3 className="font-semibold">Fastest Growing</h3>
                </div>
                <p className="text-2xl font-bold">Africa</p>
                <p className="text-sm text-muted-foreground">Energy sector expansion</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold">Most Balanced</h3>
                </div>
                <p className="text-2xl font-bold">Europe</p>
                <p className="text-sm text-muted-foreground">Diversified growth</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "timeline" && (
        <Card>
          <CardHeader>
            <CardTitle>Market Events Timeline</CardTitle>
            <CardDescription>Key events and milestones shaping market trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative space-y-6">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
              {predictions.map((event, index) => (
                <div key={index} className="relative flex gap-6">
                  <div
                    className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-4 border-background ${
                      event.impact === "High Impact"
                        ? "bg-red-500"
                        : event.impact === "Medium Impact"
                          ? "bg-amber-500"
                          : "bg-green-500"
                    }`}
                  >
                    {event.category === "Automotive" && (
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-3-3H8M17 20v-7m0 7l2-2 2 2M3 10h5a2 2 0 002-2V5a2 2 0 00-2-2H3m2 0h5a2 2 0 002 2v5a2 2 0 00-2 2H5m14 0v2a3 3 0 003 3H20m0-7l-2 2-2-2"
                        />
                      </svg>
                    )}
                    {event.category === "Healthcare" && (
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-3-3H8M17 20v-7m0 7l2-2 2 2M3 10h5a2 2 0 002-2V5a2 2 0 00-2-2H3m2 0h5a2 2 0 002 2v5a2 2 0 00-2 2H5m14 0v2a3 3 0 003 3H20m0-7l-2 2-2-2"
                        />
                      </svg>
                    )}
                    {event.category === "Retail" && (
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-3-3H8M17 20v-7m0 7l2-2 2 2M3 10h5a2 2 0 002-2V5a2 2 0 00-2-2H3m2 0h5a2 2 0 002 2v5a2 2 0 00-2 2H5m14 0v2a3 3 0 003 3H20m0-7l-2 2-2-2"
                        />
                      </svg>
                    )}
                    {event.category === "Technology" && (
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-3-3H8M17 20v-7m0 7l2-2 2 2M3 10h5a2 2 0 002-2V5a2 2 0 00-2-2H3m2 0h5a2 2 0 002 2v5a2 2 0 00-2 2H5m14 0v2a3 3 0 003 3H20m0-7l-2 2-2-2"
                        />
                      </svg>
                    )}
                    {event.category === "Energy" && (
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-3-3H8M17 20v-7m0 7l2-2 2 2M3 10h5a2 2 0 002-2V5a2 2 0 00-2-2H3m2 0h5a2 2 0 002 2v5a2 2 0 00-2 2H5m14 0v2a3 3 0 003 3H20m0-7l-2 2-2-2"
                        />
                      </svg>
                    )}
                    {event.category === "Logistics" && (
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-3-3H8M17 20v-7m0 7l2-2 2 2M3 10h5a2 2 0 002-2V5a2 2 0 00-2-2H3m2 0h5a2 2 0 002 2v5a2 2 0 00-2 2H5m14 0v2a3 3 0 003 3H20m0-7l-2 2-2-2"
                        />
                      </svg>
                    )}
                    {event.category === "Telecommunications" && (
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-3-3H8M17 20v-7m0 7l2-2 2 2M3 10h5a2 2 0 002-2V5a2 2 0 00-2-2H3m2 0h5a2 2 0 002 2v5a2 2 0 00-2 2H5m14 0v2a3 3 0 003 3H20m0-7l-2 2-2-2"
                        />
                      </svg>
                    )}
                    {event.category === "Manufacturing" && (
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-3-3H8M17 20v-7m0 7l2-2 2 2M3 10h5a2 2 0 002-2V5a2 2 0 00-2-2H3m2 0h5a2 2 0 002 2v5a2 2 0 00-2 2H5m14 0v2a3 3 0 003 3H20m0-7l-2 2-2-2"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 rounded-lg border border-border bg-card p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold">{event.title}</h3>
                      <Badge variant="outline">{event.quarter}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {event.category}
                      </Badge>
                      <Badge
                        className={
                          event.impact === "High Impact"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400"
                            : event.impact === "Medium Impact"
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              : "bg-green-500/10 text-green-600 dark:text-green-400"
                        }
                      >
                        {event.impact} impact
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "geographic" && (
        <Card>
          <CardHeader>
            <CardTitle>Geographic Market Distribution</CardTitle>
            <CardDescription>Average market presence across all tracked competitors</CardDescription>
          </CardHeader>
          <CardContent>
            <WorldMap data={averageGeographicData} onRegionClick={(region) => console.log("Clicked:", region)} />

            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(averageGeographicData).map(([key, value]) => {
                const regionNames: Record<string, string> = {
                  northAmerica: "North America",
                  southAmerica: "South America",
                  europe: "Europe",
                  africa: "Africa",
                  asia: "Asia",
                  oceania: "Oceania",
                }

                return (
                  <div key={key} className="rounded-lg border border-border bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="font-semibold">{regionNames[key]}</h3>
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Average Presence</span>
                        <span className="text-lg font-bold">{value}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {selectedPrediction && selectedPredictionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-2xl">
            <button
              onClick={() => setSelectedPrediction(null)}
              className="absolute right-4 top-4 rounded-lg p-2 hover:bg-accent"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="mb-4 text-2xl font-bold">{selectedPredictionData.title}</h2>

            <div className="mb-6 flex flex-wrap gap-2">
              <Badge variant="outline">{selectedPredictionData.category}</Badge>
              <Badge
                className={
                  selectedPredictionData.impact === "High Impact"
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : selectedPredictionData.impact === "Medium Impact"
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "bg-green-500/10 text-green-600 dark:text-green-400"
                }
              >
                {selectedPredictionData.impact}
              </Badge>
              <Badge variant="secondary">{selectedPredictionData.quarter}</Badge>
            </div>

            <p className="mb-6 text-muted-foreground">{selectedPredictionData.description}</p>

            <div className="mb-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="mb-1 text-sm text-muted-foreground">Probability</p>
                <p className="text-2xl font-bold">{selectedPredictionData.probability}%</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="mb-1 text-sm text-muted-foreground">Affected Regions</p>
                <p className="text-sm font-medium">{selectedPredictionData.affectedRegions.join(", ")}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1">
                <AlertCircle className="mr-2 h-4 w-4" />
                Set Alert
              </Button>
              <Button variant="outline" className="flex-1 bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
