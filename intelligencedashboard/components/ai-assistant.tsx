"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Bot, Send, X, Settings, Sparkles, TrendingUp, Target, Lightbulb, MessageSquare, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCompetitors } from "@/lib/competitor-context"
import { generateNewsDigest } from "@/lib/news-backend"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const suggestedQuestions = [
  "What are my top competitors doing?",
  "Show me market trends",
  "Analyze feature gaps",
  "Generate competitive report",
  "Show me today's news digest",
]

const mockResponses = [
  "Based on recent data, Figma has launched 3 new AI features this month, focusing on automated design suggestions and smart layouts.",
  "Your market position has improved by 12% this quarter. Key growth drivers include your AI-powered design tools and collaborative features.",
  "I've identified 5 feature gaps where competitors are lacking: real-time voice collaboration, advanced animation tools, 3D design integration, AI-powered brand consistency, and automated accessibility checking.",
  "I'll generate a comprehensive competitive analysis report. This includes market share trends, feature comparisons, threat assessments, and strategic recommendations.",
]

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [hasApiKey, setHasApiKey] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'm your AI competitive intelligence assistant. I can help you analyze competitors, identify market trends, generate insights, and provide news digests. What would you like to know?",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { competitors } = useCompetitors()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (content?: string) => {
    const messageContent = content || inputValue.trim()
    if (!messageContent) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    setTimeout(() => {
      let response = ""

      // Check if user is asking about news
      if (messageContent.toLowerCase().includes("news") || messageContent.toLowerCase().includes("digest")) {
        const competitorNames = competitors.map((c) => c.name)
        const digest = generateNewsDigest(competitorNames)
        response = `I've analyzed ${digest.totalArticles} news articles from the past 24 hours. Here are the key highlights:\n\n📰 Top Stories: ${digest.topStories.length} breaking news items\n📊 Competitor Mentions: ${digest.competitorMentions.map((m) => `${m.competitor} (${m.count} articles)`).join(", ")}\n🔥 Trending: ${digest.trendingTopics
          .slice(0, 3)
          .map((t) => t.topic)
          .join(", ")}\n\nVisit the News Digest page for detailed analysis and source links.`
      } else {
        const responseIndex = Math.floor(Math.random() * mockResponses.length)
        response = mockResponses[responseIndex]
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      setHasApiKey(true)
      setShowSettings(false)
      console.log("[v0] API Key saved:", apiKey.substring(0, 10) + "...")
    }
  }

  return (
    <>
      {!isOpen && (
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-gradient-to-r from-primary to-purple-600"
          onClick={() => setIsOpen(true)}
        >
          <Bot className="h-6 w-6" />
          <span className="sr-only">Open AI Assistant</span>
        </Button>
      )}

      {isOpen && (
        <Card
          className={cn(
            "fixed bottom-6 right-6 w-96 shadow-2xl z-50 transition-all",
            isMinimized ? "h-16" : "h-[600px]",
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b bg-gradient-to-r from-primary/10 to-purple-600/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-purple-600">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Assistant</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <CardDescription className="text-xs">Online</CardDescription>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsMinimized(!isMinimized)}>
                <span className="text-lg">{isMinimized ? "□" : "−"}</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {!isMinimized && (
            <>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 h-[420px]">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {message.role === "assistant" && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-primary to-purple-600 flex-shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2 max-w-[80%]",
                        message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                      )}
                    >
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-primary to-purple-600">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="rounded-lg px-4 py-2 bg-muted">
                      <div className="flex gap-1">
                        <div
                          className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              {messages.length === 1 && (
                <div className="px-4 pb-4">
                  <p className="text-xs text-muted-foreground mb-2">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((question, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="text-xs h-auto py-1 bg-transparent"
                        onClick={() => handleSendMessage(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask me anything..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={!hasApiKey}
                  />
                  <Button size="icon" onClick={() => handleSendMessage()} disabled={!inputValue.trim() || !hasApiKey}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                {!hasApiKey && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                    Please configure your API key in settings to start chatting
                  </p>
                )}
              </div>
            </>
          )}
        </Card>
      )}

      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>AI Assistant Settings</DialogTitle>
            <DialogDescription>
              Configure your AI assistant with an API key to enable intelligent responses
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">OpenAI API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and never sent to our servers
              </p>
            </div>

            {hasApiKey && (
              <div className="rounded-lg bg-green-500/10 p-3 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">API Key Configured</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Capabilities</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Market trend analysis</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-primary" />
                  <span>Competitor tracking</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <span>Strategic insights</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <span>Natural language queries</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Newspaper className="h-4 w-4 text-primary" />
                  <span>AI-powered news digest</span>
                </div>
              </div>
            </div>

            <Button onClick={handleSaveApiKey} className="w-full">
              Save Configuration
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
