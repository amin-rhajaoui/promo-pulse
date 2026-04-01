import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchSubgenres, startScraping, stopScraping } from "@/lib/api"
import { ProgressDisplay } from "@/components/ProgressDisplay"
import { useWebSocket } from "@/lib/ws"
import { Play, Square, Tags, Rocket } from "lucide-react"
import { cn } from "@/lib/utils"

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
      toast.success("Scraping démarré", { description: "La recherche est en cours." })
    },
    onError: (err) => {
      toast.error("Erreur", { description: (err as Error).message })
    },
  })

  const stopMutation = useMutation({
    mutationFn: () => stopScraping(activeRunId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      toast.info("Scraping arrêté")
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
        <CardHeader className="flex flex-row items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Tags className="h-4 w-4" />
          </div>
          <CardTitle className="text-base">Choisir les subgenres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Tout sélectionner
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSelected([])}>
              Tout effacer
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {(subgenres || []).map((sg) => {
              const isSelected = selected.includes(sg.id)
              return (
                <label
                  key={sg.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all duration-200",
                    "hover:border-primary/40 hover:bg-accent/50",
                    isSelected && "border-primary bg-primary/5 ring-1 ring-primary/20"
                  )}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSubgenre(sg.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium block truncate">{sg.name}</span>
                    <span className="text-xs text-muted-foreground">{sg.keyword_count} mots-clés</span>
                  </div>
                </label>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Rocket className="h-4 w-4" />
          </div>
          <CardTitle className="text-base">Lancer le scraping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer hover:bg-accent/50 transition-colors">
            <Checkbox checked={demoMode} onCheckedChange={(v) => setDemoMode(!!v)} />
            <span className="text-sm">Mode démo (aucun appel API, données fictives)</span>
          </label>

          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={handleStart}
              disabled={selected.length === 0 || isRunning || startMutation.isPending}
              className="min-w-[180px]"
            >
              {startMutation.isPending ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Démarrage…
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Démarrer le scraping
                </>
              )}
            </Button>
            {isRunning && (
              <Button variant="destructive" size="lg" onClick={() => stopMutation.mutate()}>
                <Square className="h-4 w-4 mr-2" />
                Arrêter
              </Button>
            )}
          </div>

          {startMutation.isError && (
            <p className="text-sm text-destructive">
              Erreur : {(startMutation.error as Error).message}
            </p>
          )}
        </CardContent>
      </Card>

      {(progress || isRunning) && <ProgressDisplay progress={progress} />}
    </div>
  )
}
