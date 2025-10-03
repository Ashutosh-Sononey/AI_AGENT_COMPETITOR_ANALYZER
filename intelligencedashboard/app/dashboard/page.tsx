import { Navbar } from "@/components/navbar"
import { DashboardContent } from "@/components/dashboard-content"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <DashboardContent />
    </div>
  )
}
