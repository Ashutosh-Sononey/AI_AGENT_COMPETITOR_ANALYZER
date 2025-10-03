"use client"

import { useState } from "react"

interface RegionData {
  name: string
  value: number
  color: string
}

interface WorldMapProps {
  data: Record<string, number>
  onRegionClick?: (region: string) => void
}

export function WorldMap({ data, onRegionClick }: WorldMapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  const regions = [
    {
      id: "northAmerica",
      name: "North America",
      path: "M150,80 L180,70 L220,75 L240,90 L230,120 L200,130 L170,125 L150,110 Z",
      labelX: 190,
      labelY: 100,
    },
    {
      id: "southAmerica",
      name: "South America",
      path: "M200,180 L220,170 L235,185 L240,220 L225,250 L210,245 L200,220 Z",
      labelX: 220,
      labelY: 210,
    },
    {
      id: "europe",
      name: "Europe",
      path: "M320,70 L350,65 L370,75 L365,95 L345,105 L325,100 Z",
      labelX: 345,
      labelY: 85,
    },
    {
      id: "africa",
      name: "Africa",
      path: "M320,120 L350,115 L370,130 L375,170 L360,200 L340,195 L325,170 Z",
      labelX: 350,
      labelY: 160,
    },
    {
      id: "asia",
      name: "Asia",
      path: "M400,60 L480,55 L520,70 L530,100 L510,130 L470,135 L430,120 L410,90 Z",
      labelX: 470,
      labelY: 95,
    },
    {
      id: "oceania",
      name: "Oceania",
      path: "M500,200 L530,195 L545,210 L540,230 L520,235 L505,225 Z",
      labelX: 525,
      labelY: 215,
    },
  ]

  const getColor = (value: number) => {
    if (value >= 80) return "hsl(142, 76%, 36%)"
    if (value >= 60) return "hsl(48, 96%, 53%)"
    if (value >= 40) return "hsl(25, 95%, 53%)"
    return "hsl(0, 84%, 60%)"
  }

  return (
    <div className="relative">
      <svg viewBox="0 0 700 300" className="w-full h-auto">
        <defs>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
        </defs>

        {/* Ocean background */}
        <rect width="700" height="300" fill="hsl(var(--muted))" opacity="0.3" />

        {/* Regions */}
        {regions.map((region) => {
          const value = data[region.id] || 0
          const isHovered = hoveredRegion === region.id

          return (
            <g key={region.id}>
              <path
                d={region.path}
                fill={getColor(value)}
                stroke="hsl(var(--border))"
                strokeWidth="2"
                opacity={isHovered ? 1 : 0.8}
                filter={isHovered ? "url(#shadow)" : undefined}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredRegion(region.id)}
                onMouseLeave={() => setHoveredRegion(null)}
                onClick={() => onRegionClick?.(region.id)}
              />
              {isHovered && (
                <>
                  <rect
                    x={region.labelX - 40}
                    y={region.labelY - 25}
                    width="80"
                    height="35"
                    rx="6"
                    fill="hsl(var(--popover))"
                    stroke="hsl(var(--border))"
                    strokeWidth="1"
                    filter="url(#shadow)"
                  />
                  <text
                    x={region.labelX}
                    y={region.labelY - 10}
                    textAnchor="middle"
                    className="text-xs font-semibold fill-foreground"
                  >
                    {region.name}
                  </text>
                  <text
                    x={region.labelX}
                    y={region.labelY + 5}
                    textAnchor="middle"
                    className="text-xs font-bold fill-primary"
                  >
                    {value}%
                  </text>
                </>
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded" style={{ backgroundColor: "hsl(0, 84%, 60%)" }} />
          <span className="text-muted-foreground">Low (0-40%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded" style={{ backgroundColor: "hsl(25, 95%, 53%)" }} />
          <span className="text-muted-foreground">Medium (40-60%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded" style={{ backgroundColor: "hsl(48, 96%, 53%)" }} />
          <span className="text-muted-foreground">High (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded" style={{ backgroundColor: "hsl(142, 76%, 36%)" }} />
          <span className="text-muted-foreground">Very High (80-100%)</span>
        </div>
      </div>
    </div>
  )
}
