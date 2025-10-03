import { Navbar } from "@/components/navbar"
import { MarketAnalysisContent } from "@/components/market-analysis-content"

export default function MarketAnalysisPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <MarketAnalysisContent />
    </div>
  )
}
