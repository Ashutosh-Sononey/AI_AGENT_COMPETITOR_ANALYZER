import { Navbar } from "@/components/navbar"
import { CompetitorComparisonContent } from "@/components/competitor-comparison-content"

export default function CompetitorsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <CompetitorComparisonContent />
    </div>
  )
}
