"use client"

import { useState, useEffect } from "react"
import { Bell, Check, Download, Share2, Zap, Newspaper, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCompetitors } from "@/lib/competitor-context"
import { generateAlerts } from "@/lib/mock-backend"
import Link from "next/link"

export function AlertsContent() {
  const { competitors } = useCompetitors()
  const [alertList, setAlertList] = useState<any[]>([])

  useEffect(() => {
    if (competitors.length > 0) {
      const alerts = generateAlerts(competitors.map((c) => c.name))
      setAlertList(alerts)
    } else {
      setAlertList([])
    }
  }, [competitors])

  const markAsRead = (id: string) => {
    setAlertList((prev) => prev.map((alert) => (alert.id === id ? { ...alert, read: true } : alert)))
  }

  const markAllAsRead = () => {
    setAlertList((prev) => prev.map((alert) => ({ ...alert, read: true })))
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "feature":
        return <Zap className="h-5 w-5 text-primary" />
      case "news":
        return <Newspaper className="h-5 w-5 text-blue-500" />
      case "prediction":
        return <TrendingUp className="h-5 w-5 text-green-500" />
      default:
        return <Bell className="h-5 w-5" />
    }
  }

  if (competitors.length === 0) {
    return (
      <main className="mx-auto max-w-screen-2xl px-6 py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Alerts & Reports</h1>
          <p className="text-muted-foreground">Stay updated with real-time competitor intelligence</p>
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Alerts & Reports</h1>
          <p className="text-muted-foreground">Stay updated with real-time competitor intelligence</p>
        </div>
        {alertList.length > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Alerts</CardTitle>
              <CardDescription>Latest updates from your tracked competitors</CardDescription>
            </CardHeader>
            <CardContent>
              {alertList.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No alerts yet</p>
              ) : (
                <div className="space-y-3">
                  {alertList.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex gap-4 rounded-lg border p-4 transition-colors ${
                        alert.read ? "border-border bg-muted/30" : "border-primary/50 bg-primary/5"
                      }`}
                    >
                      <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-background">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <h3 className="font-semibold">{alert.title}</h3>
                          {!alert.read && (
                            <Badge variant="default" className="flex-shrink-0">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="mb-2 text-sm text-muted-foreground">{alert.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                          {!alert.read && (
                            <Button variant="ghost" size="sm" onClick={() => markAsRead(alert.id)}>
                              Mark as read
                            </Button>
                          )}
                        </div>
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
              <CardTitle>Weekly Reports</CardTitle>
              <CardDescription>Downloadable intelligence reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {competitors.slice(0, 2).map((comp, idx) => (
                <div key={comp.id} className="rounded-lg border border-border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium">{comp.name} Analysis</h4>
                    <Badge variant="secondary">PDF</Badge>
                  </div>
                  <p className="mb-3 text-sm text-muted-foreground">
                    Comprehensive analysis of {comp.name}'s recent activities
                  </p>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Share with Team</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Generate a shareable link to collaborate with your team
              </p>
              <Button className="w-full">
                <Share2 className="mr-2 h-4 w-4" />
                Generate Share Link
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
