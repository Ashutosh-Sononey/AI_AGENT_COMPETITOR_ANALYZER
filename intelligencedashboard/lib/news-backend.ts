export interface NewsArticle {
  id: string
  title: string
  summary: string
  content: string
  source: {
    name: string
    url: string
    logo?: string
    credibility: number // 0-100
  }
  category: string
  sentiment: "positive" | "neutral" | "negative"
  relevanceScore: number // 0-100
  publishedAt: Date
  author?: string
  imageUrl?: string
  tags: string[]
  competitors: string[]
  keyInsights: string[]
  impactLevel: "high" | "medium" | "low"
}

export interface NewsDigest {
  date: Date
  totalArticles: number
  categories: { name: string; count: number }[]
  topStories: NewsArticle[]
  competitorMentions: { competitor: string; count: number; sentiment: number }[]
  trendingTopics: { topic: string; count: number; trend: "up" | "down" | "stable" }[]
}

// Mock news sources with credibility scores
const newsSources = [
  { name: "TechCrunch", url: "https://techcrunch.com", credibility: 95, logo: "/techcrunch-conference.png" },
  { name: "The Verge", url: "https://theverge.com", credibility: 92, logo: "/theverge.jpg" },
  { name: "Wired", url: "https://wired.com", credibility: 90, logo: "/wired.jpg" },
  { name: "VentureBeat", url: "https://venturebeat.com", credibility: 88, logo: "/venturebeat.jpg" },
  { name: "Forbes", url: "https://forbes.com", credibility: 85, logo: "/forbes-magazine-cover.png" },
  { name: "Business Insider", url: "https://businessinsider.com", credibility: 82, logo: "/businessinsider.jpg" },
  { name: "Reuters", url: "https://reuters.com", credibility: 98, logo: "/news-agency-building.png" },
  { name: "Bloomberg", url: "https://bloomberg.com", credibility: 96, logo: "/abstract-financial-network.png" },
]

const categories = [
  "Product Launch",
  "Funding",
  "Partnership",
  "Market Analysis",
  "Technology",
  "Strategy",
  "Acquisition",
  "Leadership",
]

const sentiments: Array<"positive" | "neutral" | "negative"> = ["positive", "neutral", "negative"]
const impactLevels: Array<"high" | "medium" | "low"> = ["high", "medium", "low"]

// Deterministic random number generator
function seededRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000
  return x - Math.floor(x)
}

// Generate realistic news articles based on competitors
export function generateNewsArticles(competitors: string[], count = 20): NewsArticle[] {
  if (competitors.length === 0) {
    return []
  }

  const articles: NewsArticle[] = []

  for (let i = 0; i < count; i++) {
    const seed = i * 1000
    const competitor = competitors[Math.floor(seededRandom(seed) * competitors.length)]
    const source = newsSources[Math.floor(seededRandom(seed + 1) * newsSources.length)]
    const category = categories[Math.floor(seededRandom(seed + 2) * categories.length)]
    const sentiment = sentiments[Math.floor(seededRandom(seed + 3) * sentiments.length)]
    const impactLevel = impactLevels[Math.floor(seededRandom(seed + 4) * impactLevels.length)]

    const titles = {
      "Product Launch": [
        `${competitor} Unveils Revolutionary AI-Powered Design Tool`,
        `${competitor} Launches New Feature Set for Enterprise Customers`,
        `Breaking: ${competitor} Announces Next-Generation Platform`,
      ],
      Funding: [
        `${competitor} Raises $${Math.floor(seededRandom(seed + 5) * 500 + 50)}M in Series ${String.fromCharCode(65 + (i % 5))} Funding`,
        `Investors Pour Millions into ${competitor}'s Growth Plans`,
        `${competitor} Secures Major Investment Round`,
      ],
      Partnership: [
        `${competitor} Partners with Major Tech Giant for Integration`,
        `Strategic Alliance: ${competitor} Teams Up with Industry Leader`,
        `${competitor} Announces Partnership to Expand Market Reach`,
      ],
      "Market Analysis": [
        `Analysts Predict Strong Growth for ${competitor} in 2025`,
        `${competitor}'s Market Share Continues to Climb`,
        `Industry Report: ${competitor} Leads in Innovation`,
      ],
      Technology: [
        `${competitor} Adopts Cutting-Edge AI Technology`,
        `How ${competitor} is Revolutionizing the Industry with New Tech`,
        `${competitor}'s Technical Innovation Sets New Standards`,
      ],
      Strategy: [
        `${competitor} Reveals Ambitious 5-Year Strategy`,
        `Inside ${competitor}'s Plan to Dominate the Market`,
        `${competitor} Pivots Strategy to Focus on Enterprise`,
      ],
      Acquisition: [
        `${competitor} Acquires Startup to Boost Capabilities`,
        `Breaking: ${competitor} Completes Major Acquisition`,
        `${competitor} Expands Through Strategic Acquisition`,
      ],
      Leadership: [
        `${competitor} Appoints New CEO to Drive Growth`,
        `Leadership Changes at ${competitor} Signal New Direction`,
        `${competitor}'s Founder Steps Down, New Era Begins`,
      ],
    }

    const titleOptions = titles[category as keyof typeof titles] || titles["Product Launch"]
    const title = titleOptions[Math.floor(seededRandom(seed + 6) * titleOptions.length)]

    const daysAgo = Math.floor(seededRandom(seed + 7) * 30)
    const publishedAt = new Date()
    publishedAt.setDate(publishedAt.getDate() - daysAgo)

    const tags = [
      category,
      competitor,
      sentiment === "positive" ? "Growth" : sentiment === "negative" ? "Challenge" : "Update",
      impactLevel === "high" ? "Breaking" : "News",
    ]

    const keyInsights = [
      `${competitor} is focusing on ${category.toLowerCase()} to gain competitive advantage`,
      `Market impact expected to be ${impactLevel}`,
      `Sentiment analysis shows ${sentiment} reception from industry`,
      `This move could affect ${Math.floor(seededRandom(seed + 8) * 30 + 10)}% of the market`,
    ]

    const imageQuery = `${competitor} ${category} technology news`

    articles.push({
      id: `news-${i}`,
      title,
      summary: `${competitor} makes significant moves in ${category.toLowerCase()}. Industry experts analyze the potential impact on the competitive landscape and market dynamics.`,
      content: `Full article content about ${competitor}'s recent ${category.toLowerCase()} activities. This development has significant implications for the industry and competitors. Analysts suggest this could reshape the competitive landscape in the coming months. The ${sentiment} sentiment from stakeholders indicates ${impactLevel} impact potential. ${competitor} has been making strategic moves to strengthen its position in the market, and this latest development is part of a broader strategy to compete more effectively. Industry watchers are closely monitoring how this will affect the competitive dynamics and what it means for other players in the space.`,
      source,
      category,
      sentiment,
      relevanceScore: Math.floor(seededRandom(seed + 9) * 40 + 60),
      publishedAt,
      author: `${["Sarah", "John", "Emily", "Michael", "Jessica"][Math.floor(seededRandom(seed + 10) * 5)]} ${["Johnson", "Smith", "Williams", "Brown", "Davis"][Math.floor(seededRandom(seed + 11) * 5)]}`,
      imageUrl: `/placeholder.svg?height=400&width=600&query=${encodeURIComponent(imageQuery)}`,
      tags,
      competitors: [competitor, ...competitors.filter((c) => c !== competitor).slice(0, 2)],
      keyInsights,
      impactLevel,
    })
  }

  return articles.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
}

// Generate daily news digest
export function generateNewsDigest(competitors: string[]): NewsDigest {
  if (competitors.length === 0) {
    return {
      date: new Date(),
      totalArticles: 0,
      categories: [],
      topStories: [],
      competitorMentions: [],
      trendingTopics: [],
    }
  }

  const articles = generateNewsArticles(competitors, 50)

  const categoryCounts = categories.map((cat) => ({
    name: cat,
    count: articles.filter((a) => a.category === cat).length,
  }))

  const competitorMentions = competitors.map((comp) => {
    const mentions = articles.filter((a) => a.competitors.includes(comp))
    const avgSentiment =
      mentions.length > 0
        ? mentions.reduce((acc, a) => {
            return acc + (a.sentiment === "positive" ? 1 : a.sentiment === "negative" ? -1 : 0)
          }, 0) / mentions.length
        : 0

    return {
      competitor: comp,
      count: mentions.length,
      sentiment: avgSentiment,
    }
  })

  const trendingTopics = [
    { topic: "AI Integration", count: 15, trend: "up" as const },
    { topic: "Enterprise Features", count: 12, trend: "up" as const },
    { topic: "Mobile Apps", count: 8, trend: "stable" as const },
    { topic: "Pricing Changes", count: 6, trend: "down" as const },
    { topic: "Partnerships", count: 10, trend: "up" as const },
  ]

  return {
    date: new Date(),
    totalArticles: articles.length,
    categories: categoryCounts,
    topStories: articles.slice(0, 10),
    competitorMentions,
    trendingTopics,
  }
}

// Search news articles
export function searchNews(query: string, competitors: string[]): NewsArticle[] {
  const allArticles = generateNewsArticles(competitors, 50)
  const lowerQuery = query.toLowerCase()

  return allArticles.filter(
    (article) =>
      article.title.toLowerCase().includes(lowerQuery) ||
      article.summary.toLowerCase().includes(lowerQuery) ||
      article.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      article.competitors.some((comp) => comp.toLowerCase().includes(lowerQuery)),
  )
}

// Filter news by category
export function filterNewsByCategory(category: string, competitors: string[]): NewsArticle[] {
  const allArticles = generateNewsArticles(competitors, 50)
  return allArticles.filter((article) => article.category === category)
}

// Filter news by sentiment
export function filterNewsBySentiment(
  sentiment: "positive" | "neutral" | "negative",
  competitors: string[],
): NewsArticle[] {
  const allArticles = generateNewsArticles(competitors, 50)
  return allArticles.filter((article) => article.sentiment === sentiment)
}

// Get news for specific competitor
export function getCompetitorNews(competitor: string, competitors: string[]): NewsArticle[] {
  const allArticles = generateNewsArticles(competitors, 50)
  return allArticles.filter((article) => article.competitors.includes(competitor))
}
