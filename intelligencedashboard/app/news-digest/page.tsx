"use client"

import { useState, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  ExternalLink,
  Calendar,
  Tag,
  BarChart3,
  Sparkles,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Zap,
} from "lucide-react"
import { useCompetitors } from "@/lib/competitor-context"
import { generateNewsDigest, generateNewsArticles, searchNews, type NewsArticle } from "@/lib/news-backend"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"

export default function NewsDigestPage() {
  const { competitors } = useCompetitors()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedSentiment, setSelectedSentiment] = useState("all")
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const competitorNames = competitors.map((c) => c.name)
  const digest = useMemo(() => generateNewsDigest(competitorNames), [competitorNames])

  const allArticles = useMemo(() => {
    if (searchQuery) {
      return searchNews(searchQuery, competitorNames)
    }
    return generateNewsArticles(competitorNames, 50)
  }, [competitorNames, searchQuery])

  const filteredArticles = useMemo(() => {
    let filtered = allArticles

    if (selectedCategory !== "all") {
      filtered = filtered.filter((a) => a.category === selectedCategory)
    }

    if (selectedSentiment !== "all") {
      filtered = filtered.filter((a) => a.sentiment === selectedSentiment)
    }

    return filtered
  }, [allArticles, selectedCategory, selectedSentiment])

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1500)
  }

  const handleExport = () => {
    const data = JSON.stringify(filteredArticles, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `news-digest-${new Date().toISOString().split("T")[0]}.json`
    a.click()
  }

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
      case "negative":
        return <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
      default:
        return <Minus className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
      case "medium":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20"
      default:
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-screen-2xl px-6 py-8">
        {competitors.length === 0 ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <Newspaper className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-bold">No Competitors Selected</h2>
            <p className="mb-6 text-muted-foreground">Select competitors to see relevant news articles and insights</p>
            <Button asChild>
              <a href="/select-competitors">Select Competitors</a>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="mb-2 text-3xl font-bold">News Digest</h1>
                <p className="text-muted-foreground">
                  AI-powered competitive intelligence from {digest.totalArticles} sources
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                  Refresh
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            {/* USP Highlights */}
            <div className="mb-8 grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">AI Summarization</p>
                      <p className="text-2xl font-bold">{digest.totalArticles}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                      <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Relevance Score</p>
                      <p className="text-2xl font-bold">
                        {Math.round(
                          filteredArticles.reduce((acc, a) => acc + a.relevanceScore, 0) / filteredArticles.length,
                        )}
                        %
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sources</p>
                      <p className="text-2xl font-bold">{new Set(filteredArticles.map((a) => a.source.name)).size}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                      <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Real-time Updates</p>
                      <p className="text-2xl font-bold">Live</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="digest" className="space-y-6">
              <TabsList>
                <TabsTrigger value="digest">Daily Digest</TabsTrigger>
                <TabsTrigger value="all">All News</TabsTrigger>
                <TabsTrigger value="trending">Trending Topics</TabsTrigger>
                <TabsTrigger value="sentiment">Sentiment Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="digest" className="space-y-6">
                {/* Top Stories */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Newspaper className="h-5 w-5" />
                      Top Stories
                    </CardTitle>
                    <CardDescription>Most relevant news from the past 24 hours</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {digest.topStories.slice(0, 5).map((article) => (
                      <div
                        key={article.id}
                        className="flex gap-4 rounded-lg border p-4 transition-colors hover:bg-accent cursor-pointer"
                        onClick={() => setSelectedArticle(article)}
                      >
                        <img
                          src={article.imageUrl || "/placeholder.svg"}
                          alt={article.title}
                          className="h-24 w-32 rounded-lg object-cover"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold leading-tight">{article.title}</h3>
                            <Badge className={cn("flex-shrink-0", getImpactColor(article.impactLevel))}>
                              {article.impactLevel} impact
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <img
                                src={article.source.logo || "/placeholder.svg"}
                                alt={article.source.name}
                                className="h-4 w-4 rounded"
                              />
                              <span>{article.source.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {getSentimentIcon(article.sentiment)}
                              <span className="capitalize">{article.sentiment}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{article.publishedAt.toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-3 w-3" />
                              <span>{article.relevanceScore}% relevant</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Competitor Mentions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Competitor Mentions</CardTitle>
                    <CardDescription>News coverage by competitor</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {digest.competitorMentions.map((mention) => (
                      <div key={mention.competitor} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{mention.competitor}</span>
                            {mention.sentiment > 0.3 ? (
                              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                            ) : mention.sentiment < -0.3 ? (
                              <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                            ) : (
                              <Minus className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">{mention.count} articles</span>
                        </div>
                        <Progress value={(mention.count / digest.totalArticles) * 100} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="all" className="space-y-6">
                {/* Filters */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            placeholder="Search news..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </div>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="Product Launch">Product Launch</SelectItem>
                          <SelectItem value="Funding">Funding</SelectItem>
                          <SelectItem value="Partnership">Partnership</SelectItem>
                          <SelectItem value="Market Analysis">Market Analysis</SelectItem>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Strategy">Strategy</SelectItem>
                          <SelectItem value="Acquisition">Acquisition</SelectItem>
                          <SelectItem value="Leadership">Leadership</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={selectedSentiment} onValueChange={setSelectedSentiment}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Sentiment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sentiment</SelectItem>
                          <SelectItem value="positive">Positive</SelectItem>
                          <SelectItem value="neutral">Neutral</SelectItem>
                          <SelectItem value="negative">Negative</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* All Articles */}
                <div className="grid gap-4">
                  {filteredArticles.map((article) => (
                    <Card
                      key={article.id}
                      className="cursor-pointer transition-colors hover:bg-accent"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex gap-4">
                          <img
                            src={article.imageUrl || "/placeholder.svg"}
                            alt={article.title}
                            className="h-32 w-48 rounded-lg object-cover flex-shrink-0"
                          />
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="text-lg font-semibold leading-tight">{article.title}</h3>
                              <Badge className={getImpactColor(article.impactLevel)}>{article.impactLevel}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{article.summary}</p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <img
                                  src={article.source.logo || "/placeholder.svg"}
                                  alt={article.source.name}
                                  className="h-5 w-5 rounded"
                                />
                                <span>{article.source.name}</span>
                                <span className="text-xs">({article.source.credibility}% credible)</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {getSentimentIcon(article.sentiment)}
                                <span className="capitalize">{article.sentiment}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{article.publishedAt.toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                <span>{article.relevanceScore}%</span>
                              </div>
                              <Badge variant="outline">{article.category}</Badge>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {article.tags.slice(0, 4).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="trending" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Trending Topics</CardTitle>
                    <CardDescription>Hot topics in your competitive landscape</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {digest.trendingTopics.map((topic) => (
                      <div key={topic.topic} className="flex items-center justify-between rounded-lg border p-4">
                        <div className="flex items-center gap-3">
                          {topic.trend === "up" ? (
                            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : topic.trend === "down" ? (
                            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                          ) : (
                            <Minus className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          )}
                          <div>
                            <p className="font-medium">{topic.topic}</p>
                            <p className="text-sm text-muted-foreground">{topic.count} mentions</p>
                          </div>
                        </div>
                        <Badge variant={topic.trend === "up" ? "default" : "secondary"}>
                          {topic.trend === "up" ? "Rising" : topic.trend === "down" ? "Falling" : "Stable"}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sentiment" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-5 w-5" />
                        Positive
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {Math.round(
                          (filteredArticles.filter((a) => a.sentiment === "positive").length /
                            filteredArticles.length) *
                            100,
                        )}
                        %
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {filteredArticles.filter((a) => a.sentiment === "positive").length} articles
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                        <Minus className="h-5 w-5" />
                        Neutral
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {Math.round(
                          (filteredArticles.filter((a) => a.sentiment === "neutral").length / filteredArticles.length) *
                            100,
                        )}
                        %
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {filteredArticles.filter((a) => a.sentiment === "neutral").length} articles
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <XCircle className="h-5 w-5" />
                        Negative
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold">
                        {Math.round(
                          (filteredArticles.filter((a) => a.sentiment === "negative").length /
                            filteredArticles.length) *
                            100,
                        )}
                        %
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {filteredArticles.filter((a) => a.sentiment === "negative").length} articles
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* Article Detail Dialog */}
      <Dialog open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedArticle && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl leading-tight pr-8">{selectedArticle.title}</DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-1">
                    <img
                      src={selectedArticle.source.logo || "/placeholder.svg?height=20&width=20&query=news logo"}
                      alt={selectedArticle.source.name}
                      className="h-5 w-5 rounded"
                    />
                    <span>{selectedArticle.source.name}</span>
                  </div>
                  <span>•</span>
                  <span>{selectedArticle.publishedAt.toLocaleDateString()}</span>
                  <span>•</span>
                  <span>By {selectedArticle.author}</span>
                  <Button variant="link" size="sm" className="h-auto p-0" asChild>
                    <a href={selectedArticle.source.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-3 w-3" />
                      View Source
                    </a>
                  </Button>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <img
                  src={
                    selectedArticle.imageUrl ||
                    `/placeholder.svg?height=400&width=800&query=${encodeURIComponent(selectedArticle.title) || "/placeholder.svg"}`
                  }
                  alt={selectedArticle.title}
                  className="w-full rounded-lg object-cover"
                />

                <div className="flex flex-wrap gap-2">
                  <Badge className={getImpactColor(selectedArticle.impactLevel)}>
                    {selectedArticle.impactLevel} impact
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getSentimentIcon(selectedArticle.sentiment)}
                    {selectedArticle.sentiment}
                  </Badge>
                  <Badge variant="outline">{selectedArticle.category}</Badge>
                  <Badge variant="outline">
                    <Target className="mr-1 h-3 w-3" />
                    {selectedArticle.relevanceScore}% relevant
                  </Badge>
                  <Badge variant="outline">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {selectedArticle.source.credibility}% credible
                  </Badge>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-muted-foreground">{selectedArticle.summary}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Full Article</h3>
                  <p className="text-muted-foreground leading-relaxed">{selectedArticle.content}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    AI-Generated Key Insights
                  </h3>
                  <ul className="space-y-2">
                    {selectedArticle.keyInsights.map((insight, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="text-primary">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Related Competitors</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.competitors.map((comp) => (
                      <Badge key={comp} variant="secondary">
                        {comp}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedArticle.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        <Tag className="mr-1 h-3 w-3" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
