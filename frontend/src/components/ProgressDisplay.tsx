import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type { ScrapeProgress } from "@/lib/types"
import { Radio, Mail, Search, Gauge } from "lucide-react"

interface Props {
  progress: ScrapeProgress | null
}

export function ProgressDisplay({ progress }: Props) {
  if (!progress) return null

  const pct = progress.total_keywords > 0
    ? (progress.completed_keywords / progress.total_keywords) * 100
    : 0

  const statusColor = {
    running: "bg-blue-500 text-white",
    completed: "bg-green-600 text-white",
    failed: "bg-red-600 text-white",
    cancelled: "bg-yellow-500 text-black",
  }[progress.status] || "bg-gray-400"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Progress</CardTitle>
          <Badge className={statusColor}>{progress.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Keywords: {progress.completed_keywords} / {progress.total_keywords}</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <Progress value={pct} />
        </div>

        {progress.current_keyword && progress.status === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-3 w-3 animate-spin" />
            Searching: <span className="font-medium text-foreground">{progress.current_keyword}</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-bold">{progress.channels_found}</div>
              <div className="text-xs text-muted-foreground">Channels</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-bold">{progress.emails_found}</div>
              <div className="text-xs text-muted-foreground">Emails</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="text-lg font-bold">{progress.quota_used}</div>
              <div className="text-xs text-muted-foreground">Quota Used</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
