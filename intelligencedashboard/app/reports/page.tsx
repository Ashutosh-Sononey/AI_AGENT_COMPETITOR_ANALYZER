"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, BarChart3, TrendingUp, Target, CalendarIcon } from "lucide-react"
import {
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts"
import { format } from "date-fns"
import { useCompetitors } from "@/lib/competitor-context"
import { generateCompetitorAnalysis, generateReports } from "@/lib/mock-backend"
import Link from "next/link"

export default function ReportsPage() {
  const { competitors } = useCompetitors()
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: new Date(2024, 0, 1),
    to: new Date(),
  })
  const [selectedMetric, setSelectedMetric] = useState("all")
  const [selectedCompetitor, setSelectedCompetitor] = useState("all")
  const [reportStats, setReportStats] = useState<any>({})
  const [marketShareData, setMarketShareData] = useState<any[]>([])
  const [competitorActivityData, setCompetitorActivityData] = useState<any[]>([])

  useEffect(() => {
    if (competitors.length > 0) {
      const stats = generateReports(competitors.map((c) => c.name))
      setReportStats(stats)

      // Generate market share data
      const shareData = competitors.map((comp) => {
        const analysis = generateCompetitorAnalysis(comp.name)
        return {
          name: comp.name,
          value: analysis.marketShare,
          color: `hsl(${Math.random() * 360}, 70%, 50%)`,
        }
      })
      shareData.push({
        name: "Your Product",
        value: 15,
        color: "hsl(var(--primary))",
      })
      setMarketShareData(shareData)

      // Generate activity data
      const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
      const activity = months.map((month) => {
        const data: any = { month }
        competitors.forEach((comp) => {
          const seed = comp.name.length + month.length
          data[comp.id] = Math.floor(Math.random() * 15) + 5
        })
        return data
      })
      setCompetitorActivityData(activity)
    }
  }, [competitors])

  const handleExport = (format: string) => {
    console.log(`[v0] Exporting report as ${format}`)
    alert(`Report exported as ${format.toUpperCase()}`)
  }

  if (competitors.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-screen-2xl px-6 py-8">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive insights and competitive intelligence</p>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="mb-4 text-muted-foreground">No competitors selected yet</p>
              <Link href="/select-competitors">
                <Button>Select Competitors</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-screen-2xl px-6 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="mb-2 text-3xl font-bold">Reports & Analytics</h1>
              <p className="text-muted-foreground">Comprehensive insights and competitive intelligence</p>
            </div>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <CalendarIcon className="h-4 w-4" />
                    {dateRange.from && dateRange.to
                      ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`
                      : "Select date range"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Select value={selectedCompetitor} onValueChange={setSelectedCompetitor}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Competitor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Competitors</SelectItem>
                  {competitors.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      {comp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="gap-2 bg-transparent" onClick={() => handleExport("pdf")}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reports</p>
                    <p className="text-2xl font-bold">{reportStats.totalReports || 0}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      +{Math.floor((reportStats.totalReports || 0) / 4)} this month
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Insights Generated</p>
                    <p className="text-2xl font-bold">{reportStats.insightsGenerated || 0}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      +{Math.floor((reportStats.insightsGenerated || 0) / 6)} this week
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Market Position</p>
                    <p className="text-2xl font-bold">#{reportStats.marketPosition || "N/A"}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">↑ 1 position</p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Growth Rate</p>
                    <p className="text-2xl font-bold">+{reportStats.growthRate || 0}%</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">vs last quarter</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="competitive">Competitive Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Market Share Distribution</CardTitle>
                  <CardDescription>Current market positioning</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={marketShareData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {marketShareData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Competitor Activity Trends</CardTitle>
                  <CardDescription>Feature launches over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={competitorActivityData}>
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
                      {competitors.map((comp, idx) => (
                        <Area
                          key={comp.id}
                          type="monotone"
                          dataKey={comp.id}
                          stackId="1"
                          stroke={`hsl(${(idx * 360) / competitors.length}, 70%, 50%)`}
                          fill={`hsl(${(idx * 360) / competitors.length}, 70%, 50%)`}
                          fillOpacity={0.6}
                          name={comp.name}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="competitive" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Threat & Opportunity Matrix</CardTitle>
                <CardDescription>Competitive positioning analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {competitors.map((comp) => {
                    const analysis = generateCompetitorAnalysis(comp.name)
                    const threat = analysis.marketShare + analysis.growthRate
                    const opportunity = 100 - threat
                    const trend =
                      analysis.growthRate > 10 ? "increasing" : analysis.growthRate > 0 ? "stable" : "decreasing"

                    return (
                      <div key={comp.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={comp.logo || "/placeholder.svg"} alt={comp.name} className="h-8 w-8 rounded" />
                            <span className="font-medium">{comp.name}</span>
                            <Badge
                              variant={
                                trend === "increasing" ? "destructive" : trend === "stable" ? "secondary" : "default"
                              }
                            >
                              {trend}
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-muted-foreground">Threat Level</span>
                              <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                                {Math.min(threat, 100)}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-red-500" style={{ width: `${Math.min(threat, 100)}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-muted-foreground">Opportunity</span>
                              <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                                {Math.max(opportunity, 0)}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${Math.max(opportunity, 0)}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Generate and export custom reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 p-6 bg-transparent"
                onClick={() => handleExport("pdf")}
              >
                <FileText className="h-8 w-8" />
                <div className="text-center">
                  <p className="font-semibold">Executive Summary</p>
                  <p className="text-xs text-muted-foreground">PDF Report</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 p-6 bg-transparent"
                onClick={() => handleExport("xlsx")}
              >
                <BarChart3 className="h-8 w-8" />
                <div className="text-center">
                  <p className="font-semibold">Detailed Analytics</p>
                  <p className="text-xs text-muted-foreground">Excel Spreadsheet</p>
                </div>
              </Button>
              <Button
                variant="outline"
                className="h-auto flex-col gap-2 p-6 bg-transparent"
                onClick={() => handleExport("csv")}
              >
                <Download className="h-8 w-8" />
                <div className="text-center">
                  <p className="font-semibold">Raw Data Export</p>
                  <p className="text-xs text-muted-foreground">CSV Format</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
