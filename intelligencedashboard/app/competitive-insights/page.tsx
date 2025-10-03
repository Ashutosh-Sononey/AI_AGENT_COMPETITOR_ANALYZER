import { Navbar } from "@/components/navbar"
import { CompetitiveInsightsContent } from "@/components/competitive-insights-content"

export default function CompetitiveInsightsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CompetitiveInsightsContent />
    </div>
  )
}
