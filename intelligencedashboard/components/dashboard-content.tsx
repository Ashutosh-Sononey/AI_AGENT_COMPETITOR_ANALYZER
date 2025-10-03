"use client"

import { useState, useEffect } from "react"
import {
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Trophy,
  BarChartIcon,
  Sprout,
  RefreshCw,
  Calendar,
  LineChart,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { CartesianGrid, XAxis, YAxis, ResponsiveContainer, Line } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { useCompetitors } from "@/lib/competitor-context"
import { useUser } from "@/lib/user-context"
import { useLanguage } from "@/lib/language-context"
import {
  generateCompetitorAnalysis,
  generateUpcomingEvents,
  generateCompetitorGaps,
  generateWeeklyActivity,
} from "@/lib/mock-backend"

const getChartConfig = (competitors: string[]) => {
  const colors = [
    "hsl(221, 83%, 53%)",
    "hsl(142, 76%, 36%)",
    "hsl(48, 96%, 53%)",
    "hsl(262, 83%, 58%)",
    "hsl(10, 79%, 54%)",
  ]

  const config: any = {}
  competitors.forEach((comp, idx) => {
    const key = comp.toLowerCase().replace(/\s+/g, "-")
    config[key] = {
      label: comp,
      color: colors[idx % colors.length],
    }
  })

  return config
}

export function DashboardContent() {
  const { competitors } = useCompetitors()
  const { user } = useUser()
  const { t } = useLanguage()
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null)
  const [newsFilter, setNewsFilter] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<string>("week")

  const [competitorData, setCompetitorData] = useState<any[]>([])
  const [weeklyActivityData, setWeeklyActivityData] = useState<any[]>([])
  const [newsItems, setNewsItems] = useState<any[]>([])
  const [chartConfig, setChartConfig] = useState<any>({})
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [competitorGaps, setCompetitorGaps] = useState<any[]>([])

  useEffect(() => {
    if (competitors.length > 0) {
      const analyses = competitors.map((comp) => {
        const analysis = generateCompetitorAnalysis(comp.name)
        return {
          id: comp.id,
          name: comp.name,
          logo: comp.logo,
          features: analysis.features.length,
          trend: analysis.growthRate > 0 ? "up" : "down",
          lastUpdate: `${Math.floor(Math.random() * 24)} hours ago`,
          recentActivity: analysis.recentMoves[0]?.title || "No recent activity",
          marketShare: analysis.marketShare,
          growthRate: analysis.growthRate,
        }
      })
      setCompetitorData(analyses)

      const weeklyData = generateWeeklyActivity(competitors.map((c) => c.name)).map((item) => ({
        day: t(`days.${item.day.toLowerCase()}`),
        activity: item.activity,
      }))
      setWeeklyActivityData(weeklyData)

      const news = competitors.flatMap((comp) => {
        const analysis = generateCompetitorAnalysis(comp.name)
        return analysis.recentMoves.map((move, idx) => ({
          id: `${comp.id}-${idx}`,
          company: comp.name,
          title: move.title,
          date: move.date,
          type: idx % 2 === 0 ? "feature" : "news",
          impact: move.impact === "positive" ? "high" : "medium",
          description: `${comp.name} has made significant progress in this area.`,
        }))
      })
      setNewsItems(news.slice(0, 10))

      setChartConfig(getChartConfig(competitors.map((c) => c.name)))

      setUpcomingEvents(generateUpcomingEvents(competitors.map((c) => c.name)))
      setCompetitorGaps(generateCompetitorGaps(competitors.map((c) => c.name)))
    } else {
      setCompetitorData([])
      setWeeklyActivityData([])
      setNewsItems([])
      setUpcomingEvents([])
      setCompetitorGaps([])
    }
  }, [competitors, t])

  const filteredNews = newsFilter === "all" ? newsItems : newsItems.filter((item) => item.type === newsFilter)

  const selectedCompetitorData = competitorData.find((c) => c.id === selectedCompetitor)

  const totalFeatures = competitorData.reduce((sum, c) => sum + c.features, 0)
  const avgGrowth =
    competitorData.length > 0
      ? (competitorData.reduce((sum, c) => sum + c.growthRate, 0) / competitorData.length).toFixed(1)
      : 0
  const marketMood =
    Number.parseFloat(avgGrowth as string) > 5
      ? "bullish"
      : Number.parseFloat(avgGrowth as string) > 0
        ? "neutral"
        : "bearish"

  return (
    <main className="mx-auto max-w-screen-2xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">
            {t("dashboard.welcome")}, {user?.name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-muted-foreground">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <select
            className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="day">{t("dashboard.today")}</option>
            <option value="week">{t("dashboard.this_week")}</option>
            <option value="month">{t("dashboard.this_month")}</option>
          </select>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-8 grid gap-6 md:grid-cols-4">
        <Card className="cursor-pointer transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.competitors_tracked")}</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{competitors.length}</div>
            <p className="flex items-center gap-1 text-xs text-green-500">
              <TrendingUp className="h-3 w-3" />
              {t("dashboard.active_tracking")}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.total_features")}</CardTitle>
            <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFeatures}</div>
            <p className="flex items-center gap-1 text-xs text-green-500">
              <TrendingUp className="h-3 w-3" />
              {t("dashboard.across_all")}
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.market_mood")}</CardTitle>
            <TrendingUp
              className={`h-4 w-4 ${Number.parseFloat(avgGrowth as string) > 0 ? "text-green-500" : "text-red-500"}`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${Number.parseFloat(avgGrowth as string) > 0 ? "text-green-500" : "text-red-500"}`}
            >
              {t(`dashboard.${marketMood}`)}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("dashboard.avg_growth")}: {avgGrowth}%
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-all hover:shadow-lg">
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
          {weeklyActivityData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.weekly_activity")}</CardTitle>
                <CardDescription>{t("dashboard.weekly_activity_desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    activity: {
                      label: t("dashboard.weekly_activity"),
                      color: "hsl(221, 83%, 53%)",
                    },
                  }}
                  className="h-[200px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weeklyActivityData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="day" className="text-xs" />
                      <YAxis className="text-xs" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="activity"
                        stroke="hsl(221, 83%, 53%)"
                        strokeWidth={2}
                        dot={{ fill: "hsl(221, 83%, 53%)", r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.competitor_activity")}</CardTitle>
              <CardDescription>{t("dashboard.competitor_activity_desc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {competitorData.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="mb-4 text-muted-foreground">{t("dashboard.no_competitors")}</p>
                  <Link href="/select-competitors">
                    <Button>{t("dashboard.add_competitors")}</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {competitorData.map((competitor) => (
                    <button
                      key={competitor.id}
                      onClick={() => setSelectedCompetitor(competitor.id)}
                      className="flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left transition-all hover:bg-accent hover:shadow-md"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={competitor.logo || "/placeholder.svg"}
                          alt={competitor.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium">{competitor.name}</p>
                          <p className="text-sm text-muted-foreground">{competitor.recentActivity}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {competitor.features} {t("dashboard.features")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {competitor.marketShare}% {t("dashboard.market_share")}
                            </span>
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
                            <span
                              className={`text-sm font-medium ${competitor.trend === "up" ? "text-green-500" : "text-red-500"}`}
                            >
                              {competitor.growthRate > 0 ? "+" : ""}
                              {competitor.growthRate}%
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{competitor.lastUpdate}</span>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{t("dashboard.news_digest")}</CardTitle>
                  <CardDescription>{t("dashboard.news_digest_desc")}</CardDescription>
                </div>
                <select
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  value={newsFilter}
                  onChange={(e) => setNewsFilter(e.target.value)}
                >
                  <option value="all">{t("dashboard.all_news")}</option>
                  <option value="feature">Features</option>
                  <option value="news">News</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredNews.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">{t("dashboard.no_news")}</p>
              ) : (
                <div className="space-y-3">
                  {filteredNews.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                    >
                      <div className="mt-1">
                        {item.type === "feature" ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                            <svg
                              className="h-4 w-4 text-blue-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          <p className="text-sm font-medium">{item.company}</p>
                          <Badge variant={item.impact === "high" ? "destructive" : "secondary"} className="text-xs">
                            {item.impact}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{item.date}</p>
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
              <CardTitle>{t("dashboard.key_insights")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {competitorData.length > 0 ? (
                <>
                  <div className="rounded-lg bg-amber-500/10 p-4 transition-all hover:bg-amber-500/20">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                        <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <h3 className="font-semibold">{t("dashboard.you_are_first")}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {competitorGaps.length > 0
                        ? `${competitorGaps[0].competitor} lacks ${competitorGaps[0].title.toLowerCase()}`
                        : t("dashboard.first_to_market")}
                    </p>
                    <Button variant="link" className="mt-2 h-auto p-0 text-xs">
                      {t("dashboard.view_opportunities")}
                    </Button>
                  </div>

                  <div className="rounded-lg bg-blue-500/10 p-4 transition-all hover:bg-blue-500/20">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                        <BarChartIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-semibold">{t("dashboard.competitor_planning")}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {competitorData[0]?.name} is growing at {competitorData[0]?.growthRate}% rate
                    </p>
                    <Button variant="link" className="mt-2 h-auto p-0 text-xs">
                      {t("dashboard.see_predictions")}
                    </Button>
                  </div>

                  <div className="rounded-lg bg-green-500/10 p-4 transition-all hover:bg-green-500/20">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                        <Sprout className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="font-semibold">{t("dashboard.competitor_lacks")}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {competitorGaps.length > 1
                        ? `${competitorGaps[1].title} - opportunity to differentiate`
                        : t("dashboard.identify_gaps")}
                    </p>
                    <Button variant="link" className="mt-2 h-auto p-0 text-xs">
                      {t("dashboard.explore_gaps")}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="mb-4 text-muted-foreground">Add competitors to see insights</p>
                  <Link href="/select-competitors">
                    <Button size="sm">Add Competitors</Button>
                  </Link>
                </div>
              )}

              <Link href="/competitive-insights">
                <Button className="w-full">
                  {t("dashboard.see_compare")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.quick_actions")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {t("dashboard.export_report")}
              </Button>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 002-2h2a2 2 0 002 2v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {t("dashboard.get_notified")}
              </Button>
              <Link href="/competitors">
                <Button variant="outline" className="w-full justify-start bg-transparent">
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  {t("dashboard.compare_features")}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("dashboard.upcoming_events")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Calendar className="mt-1 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedCompetitor && selectedCompetitorData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-2xl border border-border bg-card p-8 shadow-2xl">
            <button
              onClick={() => setSelectedCompetitor(null)}
              className="absolute right-4 top-4 rounded-lg p-2 hover:bg-accent"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-6 flex items-center gap-4">
              <img
                src={selectedCompetitorData.logo || "/placeholder.svg"}
                alt={selectedCompetitorData.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
              <div>
                <h2 className="text-2xl font-bold">{selectedCompetitorData.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedCompetitorData.recentActivity}</p>
              </div>
            </div>

            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="mb-1 text-sm text-muted-foreground">{t("dashboard.market_share_label")}</p>
                <p className="text-2xl font-bold">{selectedCompetitorData.marketShare}%</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="mb-1 text-sm text-muted-foreground">{t("dashboard.growth_rate")}</p>
                <p
                  className={`text-2xl font-bold ${selectedCompetitorData.growthRate > 0 ? "text-green-500" : "text-red-500"}`}
                >
                  {selectedCompetitorData.growthRate > 0 ? "+" : ""}
                  {selectedCompetitorData.growthRate}%
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="mb-1 text-sm text-muted-foreground">{t("dashboard.features_tracked")}</p>
                <p className="text-2xl font-bold">{selectedCompetitorData.features}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Link href="/competitors" className="flex-1">
                <Button className="w-full">{t("dashboard.view_full_comparison")}</Button>
              </Link>
              <Button variant="outline" className="flex-1 bg-transparent">
                {t("dashboard.set_alert")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
