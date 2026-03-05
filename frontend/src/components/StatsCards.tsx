import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Stats } from "@/lib/types"
import { formatNumber } from "@/lib/utils"
import { Users, Mail, Star, Play } from "lucide-react"

const cards = [
  { key: "total_channels" as const, label: "Total Channels", icon: Users, format: formatNumber },
  { key: "channels_with_email" as const, label: "With Email", icon: Mail, format: formatNumber },
  { key: "avg_score" as const, label: "Avg Score", icon: Star, format: (v: number) => v.toFixed(1) },
  { key: "total_runs" as const, label: "Scrape Runs", icon: Play, format: (v: number) => String(v) },
]

export function StatsCards({ stats, isLoading }: { stats?: Stats; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.key}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ key, label, icon: Icon, format }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats ? format(stats[key]) : "0"}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
