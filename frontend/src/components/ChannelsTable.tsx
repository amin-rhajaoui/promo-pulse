import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Channel } from "@/lib/types"
import { formatNumber } from "@/lib/utils"
import { ChevronLeft, ChevronRight, MessageSquare, Music, ShoppingCart, Trash2 } from "lucide-react"

const tierColors: Record<string, string> = {
  S: "bg-green-600 text-white",
  A: "bg-blue-600 text-white",
  B: "bg-yellow-500 text-black",
  C: "bg-gray-400 text-black",
}

interface Props {
  channels: Channel[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onSelect: (channel: Channel) => void
  onDelete: (id: string) => void
  isLoading: boolean
}

export function ChannelsTable({
  channels, total, page, pageSize, onPageChange, onSelect, onDelete, isLoading,
}: Props) {
  const totalPages = Math.ceil(total / pageSize)

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    )
  }

  if (channels.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No channels found</p>
        <p className="text-sm">Try adjusting your filters or run a scrape first.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-4 text-left font-medium">Channel</th>
              <th className="h-10 px-4 text-left font-medium">Subs</th>
              <th className="h-10 px-4 text-left font-medium">Score</th>
              <th className="h-10 px-4 text-left font-medium">Emails</th>
              <th className="h-10 px-4 text-left font-medium">Authenticity</th>
              <th className="h-10 px-4 text-left font-medium">Subgenres</th>
              <th className="h-10 px-4 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((ch) => {
              const emailCount = (ch.emails_pro?.length || 0) + (ch.emails_personal?.length || 0)
              return (
                <tr
                  key={ch.id}
                  className="border-b hover:bg-muted/50 cursor-pointer"
                  onClick={() => onSelect(ch)}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {ch.thumbnail_url && (
                        <img
                          src={ch.thumbnail_url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium flex items-center gap-1.5">
                          {ch.title}
                          {ch.social_links?.spotify && (
                            <Music className="h-3.5 w-3.5 text-green-500" title="Has Spotify" />
                          )}
                          {ch.notes && (
                            <MessageSquare className="h-3.5 w-3.5 text-blue-400" title="Has notes" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {ch.custom_url && (
                            <span className="text-xs text-muted-foreground">{ch.custom_url}</span>
                          )}
                          {ch.is_buyable && (
                            <Badge className="bg-red-600 text-white text-[10px] px-1.5 py-0">
                              <ShoppingCart className="h-2.5 w-2.5 mr-0.5" />
                              A racheter
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{formatNumber(ch.subscriber_count)}</td>
                  <td className="p-4">
                    <Badge className={tierColors[ch.tier || "C"]}>
                      {ch.score} ({ch.tier})
                    </Badge>
                  </td>
                  <td className="p-4">
                    {emailCount > 0 ? (
                      <Badge variant="secondary">{emailCount} email{emailCount > 1 ? "s" : ""}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge className={
                      ch.authenticity_label === "clean" ? "bg-emerald-600 text-white" :
                      ch.authenticity_label === "suspect" ? "bg-amber-500 text-black" :
                      ch.authenticity_label === "fake" ? "bg-red-600 text-white" :
                      "bg-gray-400 text-black"
                    }>
                      {ch.authenticity_label === "clean" ? "🟢" :
                       ch.authenticity_label === "suspect" ? "🟡" :
                       ch.authenticity_label === "fake" ? "🔴" : "⚪"}
                      {" "}{ch.authenticity_score}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {(ch.subgenres || []).slice(0, 2).map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                      {(ch.subgenres || []).length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{ch.subgenres.length - 2}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(ch.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          {total} channel{total !== 1 ? "s" : ""} total
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm">
            {page} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
