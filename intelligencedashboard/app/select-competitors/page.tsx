"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Plus, Loader2, LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useCompetitors } from "@/lib/competitor-context"
import { useToast } from "@/hooks/use-toast"

const commonCompetitors = [
  {
    id: "adobe",
    name: "Adobe",
    description: "Creative software suite",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=adobe",
    industry: "Design Software",
  },
  {
    id: "canva",
    name: "Canva",
    description: "Online design platform",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=canva",
    industry: "Design Software",
  },
  {
    id: "figma",
    name: "Figma",
    description: "Collaborative design tool",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=figma",
    industry: "Design Software",
  },
  {
    id: "sketch",
    name: "Sketch",
    description: "Mac design tool",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=sketch",
    industry: "Design Software",
  },
  {
    id: "invision",
    name: "InVision",
    description: "Digital product design",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=invision",
    industry: "Design Software",
  },
  {
    id: "affinity",
    name: "Affinity Designer",
    description: "Professional design",
    logo: "https://api.dicebear.com/7.x/shapes/svg?seed=affinity",
    industry: "Design Software",
  },
]

export default function SelectCompetitorsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { competitors, addCompetitor, removeCompetitor } = useCompetitors()
  const [searchQuery, setSearchQuery] = useState("")
  const [customCompetitor, setCustomCompetitor] = useState("")
  const [customUrl, setCustomUrl] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([])
  const [detectedIndustry, setDetectedIndustry] = useState("")

  const isSelected = (id: string) => competitors.some((c) => c.id === id)

  const toggleCompetitor = (competitor: (typeof commonCompetitors)[0]) => {
    if (isSelected(competitor.id)) {
      removeCompetitor(competitor.id)
      toast({
        title: "Competitor removed",
        description: `${competitor.name} has been removed from your list.`,
      })
    } else {
      addCompetitor(competitor)
      toast({
        title: "Competitor added",
        description: `${competitor.name} has been added to your list.`,
      })
    }
  }

  const handleAddCustom = async () => {
    if (!customCompetitor.trim() && !customUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a startup name or URL.",
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    const allKeywords = [
      "AI",
      "Machine Learning",
      "Analytics",
      "Cloud",
      "SaaS",
      "Enterprise",
      "Mobile",
      "Automation",
      "Data Science",
      "API",
    ]
    const detected = allKeywords.filter(() => Math.random() > 0.6).slice(0, 4)
    setDetectedKeywords(detected)

    const industries = ["Technology", "Healthcare", "Finance", "E-commerce", "Education", "Manufacturing"]
    setDetectedIndustry(industries[Math.floor(Math.random() * industries.length)])

    setIsAnalyzing(false)
    setShowAddModal(true)
  }

  const confirmAddCustom = () => {
    const competitorName = customCompetitor.trim() || extractNameFromUrl(customUrl)

    if (!competitorName) return

    const newCompetitor = {
      id: competitorName.toLowerCase().replace(/\s+/g, "-"),
      name: competitorName,
      description: `Custom competitor in ${detectedIndustry}`,
      logo: `https://api.dicebear.com/7.x/shapes/svg?seed=${competitorName}`,
      industry: detectedIndustry,
    }

    addCompetitor(newCompetitor)

    toast({
      title: "Success!",
      description: `${competitorName} has been added to your competitors.`,
    })

    setCustomCompetitor("")
    setCustomUrl("")
    setShowAddModal(false)
    setDetectedKeywords([])

    setTimeout(() => {
      router.push("/dashboard")
    }, 500)
  }

  const extractNameFromUrl = (url: string) => {
    try {
      const domain = new URL(url.startsWith("http") ? url : `https://${url}`).hostname
      const name = domain.replace("www.", "").split(".")[0]
      return name.charAt(0).toUpperCase() + name.slice(1)
    } catch {
      return url
    }
  }

  const handleContinue = () => {
    if (competitors.length === 0) {
      toast({
        title: "No competitors selected",
        description: "Please select at least one competitor to continue.",
        variant: "destructive",
      })
      return
    }
    router.push("/dashboard")
  }

  const filteredCompetitors = commonCompetitors.filter(
    (comp) =>
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.industry.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-4xl font-bold">Select Your Competitors</h1>
          <p className="text-lg text-muted-foreground">
            Choose from our curated list or add your own to start tracking their every move.
          </p>
          {competitors.length > 0 && (
            <p className="mt-2 text-sm text-primary font-medium">{competitors.length} competitors selected</p>
          )}
        </div>

        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search for competitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-12 text-base"
            />
          </div>
        </div>

        <div className="mb-12">
          <h2 className="mb-6 text-xl font-semibold">Common Competitors</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {filteredCompetitors.map((competitor) => (
              <button
                key={competitor.id}
                onClick={() => toggleCompetitor(competitor)}
                className={`group relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all hover:border-primary ${
                  isSelected(competitor.id) ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full ${
                    isSelected(competitor.id) ? "bg-primary/10" : "bg-muted"
                  }`}
                >
                  <img
                    src={competitor.logo || "/placeholder.svg"}
                    alt={competitor.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{competitor.name}</p>
                  <p className="text-xs text-muted-foreground">{competitor.description}</p>
                </div>
                {isSelected(competitor.id) && (
                  <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          {filteredCompetitors.length === 0 && searchQuery && (
            <div className="text-center py-8 text-muted-foreground">
              No competitors found matching "{searchQuery}". Try adding a custom startup below.
            </div>
          )}
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Add Custom Startup</h2>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Enter startup URL (e.g., https://tesla.com)"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                  className="h-12 pl-12"
                  disabled={isAnalyzing}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="Or enter startup name (e.g., Tesla, SpaceX, Stripe)"
                value={customCompetitor}
                onChange={(e) => setCustomCompetitor(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCustom()}
                className="h-12"
                disabled={isAnalyzing}
              />
              <Button onClick={handleAddCustom} className="h-12 px-6" disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Startup
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {competitors.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Selected Competitors</h2>
            <div className="flex flex-wrap gap-2">
              {competitors.map((comp) => (
                <Badge key={comp.id} variant="secondary" className="px-3 py-2 text-sm">
                  {comp.name}
                  <button
                    onClick={() => removeCompetitor(comp.id)}
                    className="ml-2 hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <Button onClick={handleContinue} size="lg" className="px-12" disabled={competitors.length === 0}>
            Continue to Dashboard
          </Button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-border bg-card p-8 shadow-2xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 rounded-lg p-2 hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="mb-2 text-2xl font-bold">Add Custom Startup</h2>
            <p className="mb-6 text-muted-foreground">
              We've analyzed "{customCompetitor || customUrl}" and detected the following information.
            </p>

            <div className="mb-6 space-y-3">
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="Enter startup URL"
                  className="h-14 pl-12 text-base"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={customCompetitor}
                  onChange={(e) => setCustomCompetitor(e.target.value)}
                  placeholder="Or enter startup name"
                  className="h-14 pl-12 text-base"
                />
              </div>
            </div>

            {detectedKeywords.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 font-semibold">Detected Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {detectedKeywords.map((keyword, idx) => (
                    <Badge key={idx} variant="secondary">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <h3 className="mb-3 font-semibold">Industry</h3>
              <Badge>{detectedIndustry}</Badge>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button onClick={confirmAddCustom}>Add & Go to Dashboard</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
