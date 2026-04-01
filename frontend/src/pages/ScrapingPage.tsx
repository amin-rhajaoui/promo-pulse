import { useQuery } from "@tanstack/react-query"
import { ScrapingPanel } from "@/components/ScrapingPanel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { fetchRuns, fetchQuota } from "@/lib/api"
import { Progress } from "@/components/ui/progress"

export default function ScrapingPage() {
  const { data: runs } = useQuery({
    queryKey: ["runs"],
    queryFn: fetchRuns,
    refetchInterval: 5000,
  })

  const { data: quota } = useQuery({
    queryKey: ["quota"],
    queryFn: fetchQuota,
    refetchInterval: 10000,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Scraping</h1>
        <p className="text-muted-foreground mt-1">Lancer une recherche de chaînes par subgenre</p>
      </div>

      {quota && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">API Quota Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm mb-1">
              <span>{quota.used} / {quota.limit} units</span>
              <span>{quota.remaining} remaining</span>
            </div>
            <Progress value={(quota.used / quota.limit) * 100} />
          </CardContent>
        </Card>
      )}

      <ScrapingPanel />

      {runs && runs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Run History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Status</th>
                    <th className="h-10 px-4 text-left font-medium">Subgenres</th>
                    <th className="h-10 px-4 text-left font-medium">Channels</th>
                    <th className="h-10 px-4 text-left font-medium">Emails</th>
                    <th className="h-10 px-4 text-left font-medium">Quota</th>
                    <th className="h-10 px-4 text-left font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b">
                      <td className="p-4">
                        <Badge
                          variant={run.status === "completed" ? "default" : "secondary"}
                          className={
                            run.status === "completed" ? "bg-green-600 text-white" :
                            run.status === "running" ? "bg-blue-500 text-white" :
                            run.status === "failed" ? "bg-red-600 text-white" :
                            ""
                          }
                        >
                          {run.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-xs">
                        {run.selected_subgenres.slice(0, 3).join(", ")}
                        {run.selected_subgenres.length > 3 && ` +${run.selected_subgenres.length - 3}`}
                      </td>
                      <td className="p-4">{run.channels_found}</td>
                      <td className="p-4">{run.emails_found}</td>
                      <td className="p-4">{run.quota_used}</td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(run.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
