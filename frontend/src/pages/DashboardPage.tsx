import { useQuery } from "@tanstack/react-query"
import { fetchStats } from "@/lib/api"
import { StatsCards } from "@/components/StatsCards"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/EmptyState"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { BarChart3, PieChart as PieChartIcon } from "lucide-react"

const CHART_COLORS_HEX = [
  "#4f46e5", "#059669", "#d97706", "#dc2626", "#7c3aed", "#2563eb", "#db2777", "#0891b2",
]

interface ChartTooltipProps {
  active?: boolean
  payload?: Array<{ name?: string; value?: number; color?: string }>
  label?: string
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      {label && <div className="font-medium text-foreground mb-1">{label}</div>}
      {payload.map((entry: { name?: string; value?: number; color?: string }) => (
        <div key={entry.name} className="flex items-center gap-2 text-muted-foreground">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="font-medium text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

interface PieTooltipPayloadItem {
  name?: string
  value?: number
  payload?: { value?: number }
}

function PieTooltip({ active, payload }: { active?: boolean; payload?: PieTooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  const total = payload.reduce((s: number, p: PieTooltipPayloadItem) => s + (Number(p.payload?.value) || 0), 0)
  const pct = total > 0 ? ((Number(item.payload?.value) || 0) / total) * 100 : 0
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <div className="font-medium text-foreground">{item.name}</div>
      <div className="text-muted-foreground">
        {item.value} <span className="text-foreground font-medium">({pct.toFixed(0)}%)</span>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
  })

  const scoreData = stats
    ? Object.entries(stats.score_distribution)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([bucket, count]) => ({ bucket, count }))
    : []

  const subgenreData = stats
    ? Object.entries(stats.subgenre_distribution)
        .sort(([, a], [, b]) => b - a)
        .map(([name, value]) => ({ name, value }))
    : []

  const hasChartData = scoreData.length > 0 || subgenreData.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Vue d’ensemble de votre base de chaînes</p>
      </div>
      <StatsCards stats={stats} isLoading={isLoading} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="h-4 w-4" />
            </div>
            <CardTitle className="text-base">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {scoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={scoreData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="bucket" fontSize={12} tick={{ fill: "var(--muted-foreground)" }} />
                  <YAxis fontSize={12} tick={{ fill: "var(--muted-foreground)" }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="count"
                    fill={CHART_COLORS_HEX[0]}
                    radius={[6, 6, 0, 0]}
                    animationDuration={600}
                    animationBegin={0}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={BarChart3}
                title="Aucune donnée"
                description="Lancez un scraping pour remplir les statistiques de score."
                actionLabel="Aller au scraping"
                actionTo="/scraping"
                className="h-[250px] py-8"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <PieChartIcon className="h-4 w-4" />
            </div>
            <CardTitle className="text-base">Subgenre Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {subgenreData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={subgenreData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={0}
                    paddingAngle={1}
                    animationDuration={500}
                    animationBegin={0}
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                    fontSize={11}
                  >
                    {subgenreData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS_HEX[i % CHART_COLORS_HEX.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={PieChartIcon}
                title="Aucune donnée"
                description="Lancez un scraping pour voir la répartition par subgenre."
                actionLabel="Aller au scraping"
                actionTo="/scraping"
                className="h-[250px] py-8"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
