import { Navbar } from "@/components/navbar"
import { AlertsContent } from "@/components/alerts-content"

export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <AlertsContent />
    </div>
  )
}
