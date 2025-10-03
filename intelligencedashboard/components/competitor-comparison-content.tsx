"use client"

import { Check, X, Minus, Rocket, Newspaper, FileText, Scale } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useCompetitors } from "@/lib/competitor-context"
import { generateCompetitorAnalysis } from "@/lib/mock-backend"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const getStatusIcon = (status: string) => {
  if (status === "Has") {
    return <Check className="h-4 w-4 text-green-500" />
  }
  if (status === "Missing") {
    return <X className="h-4 w-4 text-red-500" />
  }
  if (status === "Planned") {
    return <Minus className="h-4 w-4 text-amber-500" />
  }
  return null
}

export function CompetitorComparisonContent() {
  const { competitors } = useCompetitors()
  const [comparisonData, setComparisonData] = useState<any[]>([])
  const [futureFeatures, setFutureFeatures] = useState<any[]>([])

  useEffect(() => {
    if (competitors.length > 0) {
      // Generate feature comparison
      const featureCategories = [
        "Real-time Collaboration",
        "AI-powered Design",
        "Version Control",
        "Cloud Storage",
        "Mobile App",
        "API Access",
        "Custom Branding",
        "Advanced Analytics",
      ]

      const comparison = featureCategories.map((feature) => {
        const row: any = { feature }
        row.yourStartup = Math.random() > 0.3 ? "Has" : Math.random() > 0.5 ? "Planned" : "Missing"

        competitors.forEach((comp) => {
          const analysis = generateCompetitorAnalysis(comp.name)
          const featureData = analysis.features.find((f) => f.name.includes(feature.split(" ")[0]))
          row[comp.id] = featureData?.status || "Missing"
        })

        return row
      })

      setComparisonData(comparison)

      // Generate future features
      const features = competitors.slice(0, 3).map((comp, idx) => {
        const types = ["Rumor", "Patent", "News"]
        const colors = ["amber", "blue", "green"]
        const icons = [Newspaper, FileText, Scale]

        return {
          type: types[idx % 3],
          title: `${comp.name} ${idx === 0 ? "might integrate" : idx === 1 ? "files for" : "announces"} ${idx === 0 ? "generative AI" : idx === 1 ? "'AI Style Transfer' patent" : "partnership with major tech company"}.`,
          source: idx === 0 ? "Industry insider" : idx === 1 ? "Patent filings" : "Press release",
          icon: icons[idx % 3],
          color: colors[idx % 3],
        }
      })

      setFutureFeatures(features)
    }
  }, [competitors])

  if (competitors.length === 0) {
    return (
      <main className="mx-auto max-w-screen-2xl px-6 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Competitor Analysis</h1>
          <p className="text-muted-foreground">Compare your startup with key competitors in the market.</p>
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
    )
  }

  return (
    <main className="mx-auto max-w-screen-2xl px-6 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Competitor Analysis</h1>
        <p className="text-muted-foreground">Compare your startup with key competitors in the market.</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Feature Comparison</CardTitle>
          <CardDescription>Side-by-side comparison of key features and offerings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-4 pr-4 text-left font-semibold">FEATURE</th>
                  <th className="px-4 pb-4 text-left font-semibold">YOUR STARTUP</th>
                  {competitors.map((comp) => (
                    <th key={comp.id} className="px-4 pb-4 text-left font-semibold uppercase">
                      {comp.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, index) => (
                  <tr key={index} className="border-b border-border last:border-0">
                    <td className="py-4 pr-4 font-medium">{row.feature}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(row.yourStartup)}
                        <span>{row.yourStartup}</span>
                      </div>
                    </td>
                    {competitors.map((comp) => (
                      <td key={comp.id} className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(row[comp.id])}
                          <span>{row[comp.id]}</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Launch Timeline</CardTitle>
          <CardDescription>Key milestones and upcoming releases</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-6">
            {competitors.slice(0, 3).map((comp, index) => {
              const analysis = generateCompetitorAnalysis(comp.name)
              const recentMove = analysis.recentMoves[0]
              return (
                <div key={comp.id} className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Rocket className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{recentMove.title}</h3>
                      <Badge
                        variant="secondary"
                        className={
                          recentMove.impact === "positive"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }
                      >
                        {recentMove.impact}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{recentMove.date}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {futureFeatures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Prediction — Future Features</CardTitle>
            <CardDescription>Intelligence on upcoming competitor moves</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {futureFeatures.map((feature, index) => (
                <div key={index} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                        feature.color === "amber"
                          ? "bg-amber-500/10"
                          : feature.color === "blue"
                            ? "bg-blue-500/10"
                            : "bg-green-500/10"
                      }`}
                    >
                      <feature.icon
                        className={`h-5 w-5 ${
                          feature.color === "amber"
                            ? "text-amber-600 dark:text-amber-400"
                            : feature.color === "blue"
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-green-600 dark:text-green-400"
                        }`}
                      />
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        feature.color === "amber"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : feature.color === "blue"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-green-500/10 text-green-600 dark:text-green-400"
                      }
                    >
                      {feature.type}
                    </Badge>
                  </div>
                  <p className="mb-2 text-sm font-medium">{feature.title}</p>
                  <p className="text-xs text-muted-foreground">Source: {feature.source}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
