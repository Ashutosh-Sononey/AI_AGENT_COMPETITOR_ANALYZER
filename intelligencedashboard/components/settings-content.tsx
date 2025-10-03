"use client"

import { useState } from "react"
import Link from "next/link"
import { Home, BarChart3, Bell, Settings, Users, HelpCircle, Globe, Moon, Sun, Monitor } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/language-context"

const sidebarItems = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Alerts", href: "/alerts", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function SettingsContent() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, t } = useLanguage()
  const [slackEnabled, setSlackEnabled] = useState(true)
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [dataCollection, setDataCollection] = useState(true)

  return (
    <>
      <aside className="w-64 border-r border-border bg-sidebar">
        <div className="flex h-full flex-col">
          <div className="border-b border-sidebar-border p-6">
            <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Avatar className="h-12 w-12">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=sophia" />
                <AvatarFallback>SM</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sidebar-foreground">Sophia Miller</p>
                <p className="text-sm text-sidebar-foreground/70">Growth PM</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {sidebarItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-4 space-y-2">
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <Users className="h-5 w-5" />
              Invite team
            </button>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <HelpCircle className="h-5 w-5" />
              Help and docs
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-8 py-8">
          <h1 className="mb-8 text-3xl font-bold">{t("settings.title")}</h1>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("settings.appearance")}</CardTitle>
                <CardDescription>{t("settings.appearance_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium mb-3 block">{t("settings.theme")}</Label>
                  <RadioGroup value={theme} onValueChange={setTheme} className="grid grid-cols-3 gap-4">
                    <div>
                      <RadioGroupItem value="light" id="light" className="peer sr-only" />
                      <Label
                        htmlFor="light"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Sun className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">{t("settings.light")}</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                      <Label
                        htmlFor="dark"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Moon className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">{t("settings.dark")}</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="system" id="system" className="peer sr-only" />
                      <Label
                        htmlFor="system"
                        className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                      >
                        <Monitor className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">{t("settings.system")}</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("settings.language_region")}</CardTitle>
                <CardDescription>{t("settings.language_region_desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label className="text-base font-medium">{t("settings.display_language")}</Label>
                        <p className="text-sm text-muted-foreground">{t("settings.choose_language")}</p>
                      </div>
                    </div>
                    <Select value={language} onValueChange={(value) => setLanguage(value as any)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="zh">中文</SelectItem>
                        <SelectItem value="ja">日本語</SelectItem>
                        <SelectItem value="hi">हिन्दी</SelectItem>
                        <SelectItem value="ar">العربية</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("settings.competitors")}</CardTitle>
                <CardDescription>{t("settings.competitors_desc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">{t("settings.competitor_list")}</Label>
                    <p className="text-sm text-muted-foreground">{t("settings.manage_competitors")}</p>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href="/select-competitors">{t("settings.manage")}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("settings.notifications")}</CardTitle>
                <CardDescription>{t("settings.notifications_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="slack" className="text-base font-medium">
                      {t("settings.slack")}
                    </Label>
                    <p className="text-sm text-muted-foreground">{t("settings.slack_desc")}</p>
                  </div>
                  <Switch id="slack" checked={slackEnabled} onCheckedChange={setSlackEnabled} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email" className="text-base font-medium">
                      {t("settings.email")}
                    </Label>
                    <p className="text-sm text-muted-foreground">{t("settings.email_desc")}</p>
                  </div>
                  <Switch id="email" checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("settings.data_privacy")}</CardTitle>
                <CardDescription>{t("settings.data_privacy_desc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-refresh" className="text-base font-medium">
                      {t("settings.auto_refresh")}
                    </Label>
                    <p className="text-sm text-muted-foreground">{t("settings.auto_refresh_desc")}</p>
                  </div>
                  <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="data-collection" className="text-base font-medium">
                      {t("settings.usage_analytics")}
                    </Label>
                    <p className="text-sm text-muted-foreground">{t("settings.usage_analytics_desc")}</p>
                  </div>
                  <Switch id="data-collection" checked={dataCollection} onCheckedChange={setDataCollection} />
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline">{t("settings.download_data")}</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}
