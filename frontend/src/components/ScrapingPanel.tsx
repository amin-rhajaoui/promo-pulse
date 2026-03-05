import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchSubgenres, startScraping, stopScraping } from "@/lib/api"
import { ProgressDisplay } from "@/components/ProgressDisplay"
import { useWebSocket } from "@/lib/ws"
import { Play, Square } from "lucide-react"

export function ScrapingPanel() {
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<string[]>([])
  const [demoMode, setDemoMode] = useState(false)
  const [activeRunId, setActiveRunId] = useState<string | null>(null)

  const { data: subgenres } = useQuery({
    queryKey: ["subgenres"],
    queryFn: fetchSubgenres,
  })

  const { progress } = useWebSocket(activeRunId)

  const startMutation = useMutation({
    mutationFn: () => startScraping({ subgenres: selected, demo_mode: demoMode }),
    onSuccess: (run) => {
      setActiveRunId(run.id)
    },
  })

  const stopMutation = useMutation({
    mutationFn: () => stopScraping(activeRunId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
    },
  })

  const isRunning = activeRunId !== null && progress?.status === "running"
  const isDone = progress?.status === "completed" || progress?.status === "failed" || progress?.status === "cancelled"

  const toggleSubgenre = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (subgenres) {
      setSelected(subgenres.map((s) => s.id))
    }
  }

  const handleStart = () => {
    if (isDone) {
      setActiveRunId(null)
    }
    startMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Subgenres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelected([])}>
              Clear
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(subgenres || []).map((sg) => (
              <label
                key={sg.id}
                className="flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-accent"
              >
                <Checkbox
                  checked={selected.includes(sg.id)}
                  onCheckedChange={() => toggleSubgenre(sg.id)}
                />
                <div>
                  <span className="text-sm font-medium">{sg.name}</span>
                  <span className="text-xs text-muted-foreground ml-1">({sg.keyword_count})</span>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Launch Scrape</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox checked={demoMode} onCheckedChange={(v) => setDemoMode(!!v)} />
            <span className="text-sm">Demo Mode (no API calls, fake data)</span>
          </label>

          <div className="flex gap-2">
            <Button
              onClick={handleStart}
              disabled={selected.length === 0 || isRunning || startMutation.isPending}
            >
              <Play className="h-4 w-4 mr-1" />
              {startMutation.isPending ? "Starting..." : "Start Scraping"}
            </Button>
            {isRunning && (
              <Button variant="destructive" onClick={() => stopMutation.mutate()}>
                <Square className="h-4 w-4 mr-1" />
                Stop
              </Button>
            )}
          </div>

          {startMutation.isError && (
            <p className="text-sm text-destructive">
              Error: {(startMutation.error as Error).message}
            </p>
          )}
        </CardContent>
      </Card>

      {(progress || isRunning) && <ProgressDisplay progress={progress} />}
    </div>
  )
}
