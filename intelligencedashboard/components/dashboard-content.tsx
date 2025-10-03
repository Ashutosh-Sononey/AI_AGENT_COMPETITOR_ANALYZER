"use client"

import { useState, useEffect, useCallback } from "react"
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Trophy,
  BarChartIcon,
  Sprout,
  RefreshCw,
  Calendar,
  Users as UsersIcon,
  Activity as ActivityIcon,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { useUser } from "@/lib/user-context"
import { getCompetitors, runIntelligenceCheck, Competitor, Finding } from "@/lib/api"
import { AddCompetitorDialog } from "./add-competitor-dialog"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"

// This component now fetches and displays real data from the backend API,
// preserving the original UI structure.

export function DashboardContent() {
  const { user } = useUser()
  const { t } = useLanguage()
  const { toast } = useToast()

  // Raw data from API
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [findings, setFindings] = useState<Finding[]>([])

  // UI State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  // Derived data for UI
  const [competitorData, setCompetitorData] = useState<any[]>([])
  const [newsItems, setNewsItems] = useState<any[]>([])
  const [totalFeatures, setTotalFeatures] = useState(0)
  const [avgImpact, setAvgImpact] = useState(0)
  const [marketMood, setMarketMood] = useState("neutral")

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [fetchedCompetitors, initialFindings] = await Promise.all([
        getCompetitors(),
        runIntelligenceCheck()
      ])

      setCompetitors(fetchedCompetitors)
      if (Array.isArray(initialFindings)) {
        setFindings(initialFindings)
      } else {
        setFindings([])
        toast({ title: "Status", description: initialFindings.message })
      }
      setError(null)
    } catch (err) {
      setError("Failed to fetch data. Is the backend server running?")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Process raw data into data structures for the UI
  useEffect(() => {
    if (competitors.length > 0) {
      const impactScores: { [key: string]: number } = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      let totalImpactScore = 0;
      let totalKeyFeatures = 0;

      const processedData = competitors.map(comp => {
        const finding = findings.find(f => f.competitor.name === comp.name)
        const analysis = finding?.analysis

        const impactScore = analysis ? impactScores[analysis.impact] || 2 : 2;
        totalImpactScore += impactScore;
        totalKeyFeatures += analysis?.key_features?.length || 0;

        return {
          name: comp.name,
          logo: `/logos/${comp.name.toLowerCase().replace(/\s+/g, '')}.png`,
          features: analysis?.key_features?.length || 0,
          trend: analysis ? (impactScore > 2.5 ? "up" : "down") : "neutral",
          lastUpdate: comp.last_checked ? new Date(comp.last_checked).toLocaleDateString() : 'N/A',
          recentActivity: analysis?.summary || 'No recent analysis.',
          impact: analysis?.impact || 'Medium',
          threat: analysis?.threat_level || 'Low',
        }
      })

      setCompetitorData(processedData)
      setTotalFeatures(totalKeyFeatures)
      const avg = findings.length > 0 ? totalImpactScore / findings.length : 0;
      setAvgImpact(avg)
      setMarketMood(avg > 3 ? "bullish" : avg > 1.5 ? "neutral" : "bearish")

      const allNews = findings.flatMap(finding =>
        finding.updates.map(update => ({
          company: finding.competitor.name,
          title: update.title,
          date: new Date(update.detected_at).toLocaleDateString(),
          type: update.source_type === 'rss' ? 'news' : 'feature',
          impact: finding.analysis.impact.toLowerCase(),
          description: update.content.substring(0, 100) + '...',
        }))
      )
      setNewsItems(allNews)
    }
  }, [competitors, findings])


  const handleRunCheck = async () => {
    setChecking(true);
    try {
      const result = await runIntelligenceCheck();
      if (Array.isArray(result)) {
        setFindings(result);
        toast({
          title: "Intelligence Check Complete",
          description: `Found updates for ${result.length} competitors.`,
        });
      } else {
        setFindings([]);
        toast({
          title: "Intelligence Check Complete",
          description: result.message,
        });
      }
      const refreshedCompetitors = await getCompetitors();
      setCompetitors(refreshedCompetitors);
    } catch (error) {
      console.error("Failed to run intelligence check:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to run intelligence check. See console for details.",
      });
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading dashboard...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="mb-4 text-red-500 text-lg">{error}</p>
        <p className="text-sm text-muted-foreground">Please ensure the ADK API server is running.</p>
        <p className="text-sm text-muted-foreground">You can start it with `adk api_server` in the project root.</p>
      </div>
    )
  }

  return (
    <>
      <main className="mx-auto max-w-screen-2xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-3xl font-bold">
              {t("dashboard.welcome")}, {user?.name?.split(" ")[0] || "User"}
            </h1>
            <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRunCheck} disabled={checking} variant="outline" size="icon">
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            </Button>
            <AddCompetitorDialog onCompetitorAdded={fetchData} />
          </div>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.competitors_tracked")}</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{competitors.length}</div>
              <p className="text-xs text-muted-foreground">
                {competitors.filter(c => c.enabled).length} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Updates Analyzed</CardTitle>
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newsItems.length}</div>
              <p className="text-xs text-muted-foreground">in the last check</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t("dashboard.market_mood")}</CardTitle>
              <TrendingUp className={`h-4 w-4 ${avgImpact > 2 ? "text-green-500" : "text-red-500"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${avgImpact > 2 ? "text-green-500" : "text-red-500"}`}>
                {marketMood}
              </div>
              <p className="text-xs text-muted-foreground">Avg. Impact: {avgImpact.toFixed(1)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.news_items")}</CardTitle>
              <CardDescription>{t("dashboard.news_items_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{newsItems.length}</div>
              <p className="text-xs text-muted-foreground">{t("dashboard.recent_updates")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.competitor_activity")}</CardTitle>
                <CardDescription>{t("dashboard.competitor_activity_desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                {competitorData.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="mb-4 text-muted-foreground">{t("dashboard.no_competitors")}</p>
                    <AddCompetitorDialog onCompetitorAdded={fetchData} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {competitorData.map((competitor) => (
                      <div
                        key={competitor.name}
                        className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition-all hover:bg-accent hover:shadow-md"
                      >
                        <div className="flex items-center gap-4">
                           <img
                            src={competitor.logo}
                            alt={competitor.name}
                            className="h-12 w-12 rounded-lg object-cover bg-muted"
                            onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                          />
                          <div>
                            <p className="font-medium">{competitor.name}</p>
                            <p className="text-sm text-muted-foreground truncate max-w-md">{competitor.recentActivity}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {competitor.features} updates
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              {competitor.trend === "up" ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                              <span className={`text-sm font-medium ${competitor.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                                {competitor.impact}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">{competitor.lastUpdate}</span>
                          </div>
                          <ArrowRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
             <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.news_digest")}</CardTitle>
                <CardDescription>{t("dashboard.news_digest_desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                {newsItems.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">{t("dashboard.no_news")}</p>
                ) : (
                  <div className="space-y-3">
                    {newsItems.slice(0, 5).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                      >
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <p className="text-sm font-medium">{item.company}</p>
                            <Badge variant={item.impact === "high" ? "destructive" : "secondary"} className="text-xs">
                              {item.impact}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{item.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Toaster />
    </>
  )
}