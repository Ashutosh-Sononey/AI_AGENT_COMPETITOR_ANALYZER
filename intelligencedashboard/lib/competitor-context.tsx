"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface Competitor {
  id: string
  name: string
  description: string
  logo?: string
  industry: string
  website?: string
  founded?: string
  employees?: string
  revenue?: string
}

interface CompetitorContextType {
  competitors: Competitor[]
  addCompetitor: (competitor: Competitor) => void
  removeCompetitor: (id: string) => void
  updateCompetitor: (id: string, data: Partial<Competitor>) => void
  clearCompetitors: () => void
}

const CompetitorContext = createContext<CompetitorContextType | undefined>(undefined)

export function CompetitorProvider({ children }: { children: ReactNode }) {
  const [competitors, setCompetitors] = useState<Competitor[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("selected-competitors")
    if (stored) {
      try {
        setCompetitors(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to parse stored competitors:", e)
      }
    } else {
      // Default competitors
      setCompetitors([
        {
          id: "adobe",
          name: "Adobe",
          description: "Creative software suite",
          industry: "Design Software",
          website: "adobe.com",
          founded: "1982",
          employees: "26,000+",
          revenue: "$17.6B",
        },
        {
          id: "canva",
          name: "Canva",
          description: "Online design platform",
          industry: "Design Software",
          website: "canva.com",
          founded: "2012",
          employees: "4,000+",
          revenue: "$1.7B",
        },
        {
          id: "figma",
          name: "Figma",
          description: "Collaborative design tool",
          industry: "Design Software",
          website: "figma.com",
          founded: "2012",
          employees: "1,000+",
          revenue: "$400M",
        },
      ])
    }
  }, [])

  useEffect(() => {
    if (competitors.length > 0) {
      localStorage.setItem("selected-competitors", JSON.stringify(competitors))
    }
  }, [competitors])

  const addCompetitor = (competitor: Competitor) => {
    setCompetitors((prev) => [...prev, competitor])
  }

  const removeCompetitor = (id: string) => {
    setCompetitors((prev) => prev.filter((c) => c.id !== id))
  }

  const updateCompetitor = (id: string, data: Partial<Competitor>) => {
    setCompetitors((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
  }

  const clearCompetitors = () => {
    setCompetitors([])
    localStorage.removeItem("selected-competitors")
  }

  return (
    <CompetitorContext.Provider
      value={{
        competitors,
        addCompetitor,
        removeCompetitor,
        updateCompetitor,
        clearCompetitors,
      }}
    >
      {children}
    </CompetitorContext.Provider>
  )
}

export function useCompetitors() {
  const context = useContext(CompetitorContext)
  if (!context) {
    throw new Error("useCompetitors must be used within CompetitorProvider")
  }
  return context
}
