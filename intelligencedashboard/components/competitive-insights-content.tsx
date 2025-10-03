"use client"

import { useState, useMemo } from "react"
import {
  Trophy,
  LineChart,
  Sprout,
  TrendingUp,
  TrendingDown,
  Search,
  Calendar,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  Zap,
  Target,
  X,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
} from "recharts"
import { useCompetitors } from "@/lib/competitor-context"
import { generateCompetitorAnalysis, generateFeatureComparison } from "@/lib/mock-backend"

const competitorFeatures = [
  {
    id: 1,
    competitor: "Figma",
    feature: "AI-Powered Auto Layout",
    category: "Design Tools",
    launchDate: "2024-02-15",
    status: "launched",
    impact: "high",
    description: "Automatically generates responsive layouts using machine learning",
    metrics: { adoption: 78, sentiment: 85, mentions: 1240 },
    url: "https://figma.com/features/auto-layout-ai",
  },
  {
    id: 2,
    competitor: "Canva",
    feature: "Brand Kit AI",
    category: "Branding",
    launchDate: "2024-02-20",
    status: "launched",
    impact: "medium",
    description: "AI assistant that maintains brand consistency across designs",
    metrics: { adoption: 65, sentiment: 72, mentions: 890 },
    url: "https://canva.com/brand-kit-ai",
  },
  {
    id: 3,
    competitor: "Adobe XD",
    feature: "Voice Prototyping",
    category: "Prototyping",
    launchDate: "2024-03-01",
    status: "beta",
    impact: "medium",
    description: "Create voice-enabled prototypes with natural language",
    metrics: { adoption: 42, sentiment: 68, mentions: 560 },
    url: "https://adobe.com/xd/voice",
  },
  {
    id: 4,
    competitor: "Sketch",
    feature: "Real-time Collaboration 2.0",
    category: "Collaboration",
    launchDate: "2024-01-10",
    status: "launched",
    impact: "high",
    description: "Enhanced multiplayer editing with conflict resolution",
    metrics: { adoption: 82, sentiment: 90, mentions: 1580 },
    url: "https://sketch.com/collab",
  },
  {
    id: 5,
    competitor: "Figma",
    feature: "Component Variants AI",
    category: "Design Systems",
    launchDate: "2024-03-10",
    status: "planned",
    impact: "high",
    description: "AI suggests component variants based on usage patterns",
    metrics: { adoption: 0, sentiment: 0, mentions: 320 },
    url: "",
  },
]

const competitorProfiles = [
  {
    name: "Figma",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=figma",
    marketShare: 42,
    growth: 15,
    strengths: ["Real-time collaboration", "Plugin ecosystem", "Browser-based"],
    weaknesses: ["Performance with large files", "Limited offline mode"],
    recentActivity: 8,
    threatLevel: "high",
  },
  {
    name: "Canva",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=canva",
    marketShare: 28,
    growth: 22,
    strengths: ["Template library", "Ease of use", "Social media integration"],
    weaknesses: ["Limited professional tools", "Less customization"],
    recentActivity: 12,
    threatLevel: "medium",
  },
  {
    name: "Adobe XD",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=adobe",
    marketShare: 18,
    growth: -5,
    strengths: ["Adobe ecosystem", "Advanced prototyping", "Enterprise features"],
    weaknesses: ["Steep learning curve", "Expensive"],
    recentActivity: 3,
    threatLevel: "low",
  },
  {
    name: "Sketch",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=sketch",
    marketShare: 12,
    growth: -8,
    strengths: ["Mac optimization", "Plugin system", "Design systems"],
    weaknesses: ["Mac only", "No web version", "Collaboration limits"],
    recentActivity: 5,
    threatLevel: "low",
  },
]

const featureComparisonData = [
  { feature: "AI Design", yourProduct: 95, figma: 75, canva: 60, adobe: 70, sketch: 45 },
  { feature: "Collaboration", yourProduct: 85, figma: 95, canva: 70, adobe: 65, sketch: 60 },
  { feature: "Templates", yourProduct: 70, figma: 60, canva: 95, adobe: 75, sketch: 55 },
  { feature: "Performance", yourProduct: 90, figma: 80, canva: 85, adobe: 70, sketch: 85 },
  { feature: "Pricing", yourProduct: 85, figma: 75, canva: 90, adobe: 50, sketch: 70 },
]

const trendData = [
  { month: "Sep", yourProduct: 65, figma: 75, canva: 60, adobe: 55 },
  { month: "Oct", yourProduct: 70, figma: 76, canva: 62, adobe: 54 },
  { month: "Nov", yourProduct: 75, figma: 78, canva: 65, adobe: 52 },
  { month: "Dec", yourProduct: 78, figma: 80, canva: 68, adobe: 50 },
  { month: "Jan", yourProduct: 82, figma: 82, canva: 70, adobe: 48 },
  { month: "Feb", yourProduct: 88, figma: 83, canva: 72, adobe: 47 },
]

export function CompetitiveInsightsContent() {
  const { competitors } = useCompetitors()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedFeature, setSelectedFeature] = useState<any>(null)
  const [selectedCompetitor, setSelectedCompetitor] = useState<any>(null)

  const competitorAnalyses = useMemo(() => competitors.map((c) => generateCompetitorAnalysis(c.name)), [competitors])

  const featureComparisonData = useMemo(() => {
    if (competitors.length === 0) return []
    return generateFeatureComparison(competitors.map((c) => c.name))
  }, [competitors])

  const competitorFeatures = useMemo(() => {
    const features: any[] = []
    competitorAnalyses.forEach((analysis) => {
      analysis.features.forEach((feature, idx) => {
        if (feature.status !== "Missing") {
          features.push({
            id: `${analysis.id}-${idx}`,
            competitor: analysis.name,
            feature: feature.name,
            category: feature.category,
            launchDate: analysis.recentMoves[0]?.date || "2024-01-01",
            status: feature.status === "Has" ? "launched" : "planned",
            impact: analysis.threatLevel === "Critical" || analysis.threatLevel === "High" ? "high" : "medium",
            description: `${feature.name} for ${analysis.name}`,
            metrics: {
              adoption: analysis.customerSentiment,
              sentiment: analysis.customerSentiment,
              mentions: analysis.socialMedia.mentions,
            },
            url: "",
          })
        }
      })
    })
    return features
  }, [competitorAnalyses])

  const filteredFeatures = competitorFeatures.filter((feature) => {
    const matchesSearch =
      feature.feature.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.competitor.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || feature.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || feature.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "launched":
        return <CheckCircle2 className="h-4 w-4" />
      case "beta":
        return <Clock className="h-4 w-4" />
      case "planned":
        return <AlertCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600 dark:text-red-400 bg-red-500/10"
      case "medium":
        return "text-amber-600 dark:text-amber-400 bg-amber-500/10"
      case "low":
        return "text-green-600 dark:text-green-400 bg-green-500/10"
      default:
        return "text-muted-foreground bg-muted"
    }
  }

  const getThreatColor = (level: string) => {
    switch (level) {
      case "Critical":
      case "High":
        return "bg-red-500"
      case "Medium":
        return "bg-amber-500"
      case "Low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  if (competitors.length === 0) {
    return (
      <main className="mx-auto max-w-screen-2xl px-6 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-bold">No Competitors Selected</h2>
            <p className="mb-4 text-muted-foreground">Please add competitors to view competitive insights</p>
            <Button onClick={() => (window.location.href = "/select-competitors")}>Select Competitors</Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-screen-2xl px-6 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Competitive Insights</h1>
        <p className="text-muted-foreground">
          Stay ahead of the curve with real-time updates on competitor feature launches.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Competitors</p>
                  <p className="text-2xl font-bold">{competitors.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New Features</p>
                  <p className="text-2xl font-bold">
                    {competitorFeatures.filter((f) => f.status === "launched").length}
                  </p>
                </div>
                <Zap className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Market Position</p>
                  <p className="text-2xl font-bold">#2</p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Growth Rate</p>
                  <p className="text-2xl font-bold">
                    +
                    {Math.round(
                      competitorAnalyses.reduce((acc, c) => acc + c.growthRate, 0) / competitorAnalyses.length,
                    )}
                    %
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="features" className="space-y-6">
        <TabsList>
          <TabsTrigger value="features">Feature Tracking</TabsTrigger>
          <TabsTrigger value="competitors">Competitor Profiles</TabsTrigger>
          <TabsTrigger value="comparison">Feature Comparison</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Competitor Feature Launches</CardTitle>
                  <CardDescription>Track and analyze new features from competitors</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search features..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Collaboration">Collaboration</SelectItem>
                      <SelectItem value="AI/ML">AI/ML</SelectItem>
                      <SelectItem value="Analytics">Analytics</SelectItem>
                      <SelectItem value="Integration">Integration</SelectItem>
                      <SelectItem value="Mobile">Mobile</SelectItem>
                      <SelectItem value="Security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="launched">Launched</SelectItem>
                      <SelectItem value="beta">Beta</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredFeatures.slice(0, 10).map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-start gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-accent/50 cursor-pointer"
                    onClick={() => setSelectedFeature(feature)}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <img
                        src={`https://api.dicebear.com/7.x/shapes/svg?seed=${feature.competitor}`}
                        alt={feature.competitor}
                        className="h-8 w-8"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{feature.feature}</h3>
                            <Badge variant="outline" className="text-xs">
                              {feature.competitor}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(feature.launchDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1 capitalize">{feature.status}</span>
                            <Badge className={getImpactColor(feature.impact)}>
                              {feature.impact.toUpperCase()} IMPACT
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex gap-2">
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Adoption</p>
                              <p className="text-lg font-bold">{feature.metrics.adoption}%</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-muted-foreground">Sentiment</p>
                              <p className="text-lg font-bold">{feature.metrics.sentiment}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/20">
                    <Trophy className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">You are first to market</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your AI-powered design assistant has no direct competitor equivalent
                    </p>
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20">
                    <LineChart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">3 competitors planning similar</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Figma, Canva, and Adobe are developing AI features
                    </p>
                    <Button size="sm" variant="outline">
                      Track Progress
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20">
                    <Sprout className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">5 gap opportunities found</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Features competitors lack that you can capitalize on
                    </p>
                    <Button size="sm" variant="outline">
                      Explore Gaps
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitors" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {competitorAnalyses.map((competitor) => (
              <Card
                key={competitor.id}
                className="cursor-pointer transition-all hover:shadow-lg"
                onClick={() => setSelectedCompetitor(competitor)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://api.dicebear.com/7.x/shapes/svg?seed=${competitor.name}`}
                        alt={competitor.name}
                        className="h-12 w-12 rounded-lg"
                      />
                      <div>
                        <CardTitle>{competitor.name}</CardTitle>
                        <CardDescription>Market Share: {competitor.marketShare}%</CardDescription>
                      </div>
                    </div>
                    <Badge className={getThreatColor(competitor.threatLevel)}>
                      {competitor.threatLevel.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Market Share</span>
                      <span className="text-sm text-muted-foreground">{competitor.marketShare}%</span>
                    </div>
                    <Progress value={competitor.marketShare} className="h-2" />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Growth:</span>
                    <span
                      className={`flex items-center gap-1 text-sm font-semibold ${competitor.growthRate > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {competitor.growthRate > 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {Math.abs(competitor.growthRate)}%
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Strengths</p>
                    <div className="flex flex-wrap gap-2">
                      {competitor.strengths.map((strength: string, idx: number) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {strength}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Weaknesses</p>
                    <div className="flex flex-wrap gap-2">
                      {competitor.weaknesses.map((weakness: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {weakness}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-muted-foreground">Customer Sentiment</span>
                    <span className="text-sm font-semibold">{competitor.customerSentiment}%</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Feature Comparison Matrix</CardTitle>
              <CardDescription>Compare features across all tracked competitors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Feature</th>
                      {competitors.map((comp) => (
                        <th key={comp.id} className="text-center p-3 font-semibold">
                          {comp.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {featureComparisonData.map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-accent/50">
                        <td className="p-3 font-medium">{row.feature}</td>
                        {competitors.map((comp) => {
                          const key = comp.name.toLowerCase().replace(/\s+/g, "-")
                          const hasFeature = row[key]
                          return (
                            <td key={comp.id} className="text-center p-3">
                              {hasFeature ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mx-auto" />
                              ) : (
                                <X className="h-5 w-5 text-red-600 dark:text-red-400 mx-auto" />
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Market Position Trends</CardTitle>
              <CardDescription>6-month competitive positioning analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="yourProduct"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    name="Your Product"
                  />
                  <Line type="monotone" dataKey="figma" stroke="#8b5cf6" strokeWidth={2} name="Figma" />
                  <Line type="monotone" dataKey="canva" stroke="#06b6d4" strokeWidth={2} name="Canva" />
                  <Line type="monotone" dataKey="adobe" stroke="#f59e0b" strokeWidth={2} name="Adobe XD" />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="max-w-2xl">
          {selectedFeature && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedFeature.feature}
                  <Badge variant="outline">{selectedFeature.competitor}</Badge>
                </DialogTitle>
                <DialogDescription>{selectedFeature.description}</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-accent">
                    <p className="text-sm text-muted-foreground mb-1">Adoption Rate</p>
                    <p className="text-2xl font-bold">{selectedFeature.metrics.adoption}%</p>
                    <Progress value={selectedFeature.metrics.adoption} className="mt-2 h-2" />
                  </div>
                  <div className="text-center p-4 rounded-lg bg-accent">
                    <p className="text-sm text-muted-foreground mb-1">User Sentiment</p>
                    <p className="text-2xl font-bold">{selectedFeature.metrics.sentiment}%</p>
                    <Progress value={selectedFeature.metrics.sentiment} className="mt-2 h-2" />
                  </div>
                  <div className="text-center p-4 rounded-lg bg-accent">
                    <p className="text-sm text-muted-foreground mb-1">Social Mentions</p>
                    <p className="text-2xl font-bold">{selectedFeature.metrics.mentions}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Category:</span>
                    <Badge variant="secondary">{selectedFeature.category}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Launch Date:</span>
                    <span className="text-sm">{new Date(selectedFeature.launchDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge className={getImpactColor(selectedFeature.impact)}>
                      {selectedFeature.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Impact Level:</span>
                    <Badge className={getImpactColor(selectedFeature.impact)}>
                      {selectedFeature.impact.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                {selectedFeature.url && (
                  <Button className="w-full" asChild>
                    <a href={selectedFeature.url} target="_blank" rel="noopener noreferrer">
                      View Feature Details
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedCompetitor} onOpenChange={() => setSelectedCompetitor(null)}>
        <DialogContent className="max-w-3xl">
          {selectedCompetitor && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <img
                    src={`https://api.dicebear.com/7.x/shapes/svg?seed=${selectedCompetitor.name}`}
                    alt={selectedCompetitor.name}
                    className="h-12 w-12 rounded-lg"
                  />
                  <div>
                    <DialogTitle>{selectedCompetitor.name}</DialogTitle>
                    <DialogDescription>Detailed competitor analysis</DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-1">Market Share</p>
                      <p className="text-3xl font-bold mb-2">{selectedCompetitor.marketShare}%</p>
                      <Progress value={selectedCompetitor.marketShare} className="h-2" />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground mb-1">Growth Rate</p>
                      <p
                        className={`text-3xl font-bold mb-2 ${selectedCompetitor.growthRate > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {selectedCompetitor.growthRate > 0 ? "+" : ""}
                        {selectedCompetitor.growthRate}%
                      </p>
                      <div className="flex items-center gap-1 text-sm">
                        {selectedCompetitor.growthRate > 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span>{selectedCompetitor.growthRate > 0 ? "Growing" : "Declining"}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Competitive Strengths</h4>
                  <div className="space-y-2">
                    {selectedCompetitor.strengths.map((strength: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Competitive Weaknesses</h4>
                  <div className="space-y-2">
                    {selectedCompetitor.weaknesses.map((weakness: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10">
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span className="text-sm">{weakness}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-accent">
                  <span className="font-medium">Threat Level</span>
                  <Badge className={getThreatColor(selectedCompetitor.threatLevel)}>
                    {selectedCompetitor.threatLevel.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
