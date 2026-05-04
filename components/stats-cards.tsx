"use client"

import { useEffect, useState } from "react"
import { Shield, FileText, AlertTriangle, Activity } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Stats {
  totalWords: number
  totalLogs: number
  totalFound: number
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats>({ totalWords: 0, totalLogs: 0, totalFound: 0 })

  useEffect(() => {
    fetch("/api/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setStats(data.data)
      })
  }, [])

  const items = [
    { label: "Banned Words", value: stats.totalWords, icon: Shield, color: "text-blue-600", bg: "bg-blue-500/10" },
    { label: "Total Scans", value: stats.totalLogs, icon: FileText, color: "text-purple-600", bg: "bg-purple-500/10" },
    { label: "Violations Found", value: stats.totalFound, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-500/10" },
    { label: "Active Filters", value: "100%", icon: Activity, color: "text-green-600", bg: "bg-green-500/10" },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="border shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`${item.bg} p-2.5 rounded-lg`}>
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}