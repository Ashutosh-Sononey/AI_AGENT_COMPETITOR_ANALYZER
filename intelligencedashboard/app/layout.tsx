import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { AIAssistant } from "@/components/ai-assistant"
import { CompetitorProvider } from "@/lib/competitor-context"
import { UserProvider } from "@/lib/user-context"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"
import { LanguageProvider } from "@/lib/language-context"
import "./globals.css"

export const metadata: Metadata = {
  title: "InsightEdge - Competitive Intelligence Platform",
  description: "AI-powered competitive intelligence and market analysis",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <Suspense fallback={null}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <LanguageProvider>
              <UserProvider>
                <CompetitorProvider>
                  {children}
                  <AIAssistant />
                </CompetitorProvider>
              </UserProvider>
            </LanguageProvider>
            <Toaster />
          </ThemeProvider>
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
