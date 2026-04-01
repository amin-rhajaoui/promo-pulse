import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { ScrapeProgress } from "@/lib/types"
import { Radio, Mail, Search, Gauge } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  progress: ScrapeProgress | null
}

const statusConfig = {
  running: { label: "En cours", class: "bg-primary text-primary-foreground" },
  completed: { label: "Terminé", class: "bg-emerald-600 text-white" },
  failed: { label: "Échec", class: "bg-destructive text-destructive-foreground" },
  cancelled: { label: "Annulé", class: "bg-amber-500 text-black" },
} as const

export function ProgressDisplay({ progress }: Props) {
  if (!progress) return null

  const pct = progress.total_keywords > 0
    ? (progress.completed_keywords / progress.total_keywords) * 100
    : 0

  const status = statusConfig[progress.status as keyof typeof statusConfig] ?? {
    label: progress.status,
    class: "bg-muted text-muted-foreground",
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Progression</CardTitle>
          <Badge className={cn("font-medium", status.class)}>{status.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">
              Mots-clés : {progress.completed_keywords} / {progress.total_keywords}
            </span>
            <span className="font-medium tabular-nums">{Math.round(pct)}%</span>
          </div>
          <Progress value={pct} variant={progress.status as keyof typeof statusConfig} />
        </div>

        {progress.current_keyword && progress.status === "running" && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            <Search className="h-3.5 w-3.5 animate-spin shrink-0" />
            <span>Recherche :</span>
            <span className="font-medium text-foreground truncate">{progress.current_keyword}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <StatPill
            icon={Radio}
            value={progress.channels_found}
            label="Chaînes"
            iconClass="bg-primary/10 text-primary"
          />
          <StatPill
            icon={Mail}
            value={progress.emails_found}
            label="Emails"
            iconClass="bg-emerald-500/10 text-emerald-600"
          />
          <StatPill
            icon={Gauge}
            value={progress.quota_used}
            label="Quota"
            iconClass="bg-amber-500/10 text-amber-600"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function StatPill({
  icon: Icon,
  value,
  label,
  iconClass,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: number
  label: string
  iconClass: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", iconClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold tabular-nums">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  )
}
